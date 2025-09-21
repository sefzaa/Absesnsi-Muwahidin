const db = require('../models');
// --- ▼▼▼ 1. IMPORT MODEL KEGIATAN ▼▼▼ ---
const { Santri, Kelas, AbsenKegiatan, AbsenSekolah, JamPelajaran, Kegiatan } = db;
const { Op, Sequelize } = require('sequelize');

// ... (fungsi calculatePerformance dan getInitialFilters tidak berubah) ...
const calculatePerformance = (hadir, total) => {
    if (total === 0) return 0;
    return (hadir / total) * 100;
};
exports.getInitialFilters = async (req, res) => {
    if (req.user.jabatan !== 'direktur') {
        return res.status(403).send({ message: "Akses ditolak! Membutuhkan peran Direktur." });
    }
    try {
        const kelas = await Kelas.findAll({
            attributes: ['id_kelas', 'nama_kelas'],
            order: [['nama_kelas', 'ASC']]
        });
        res.status(200).send(kelas);
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil data kelas.", error: error.message });
    }
};
exports.getRekapAbsensi = async (req, res) => {
    if (req.user.jabatan !== 'direktur') {
        return res.status(403).send({ message: "Akses ditolak! Membutuhkan peran Direktur." });
    }
    try {
        const { bulan, tahun, id_kelas, jenis_kelamin } = req.query;

        if (!bulan || !tahun) {
            return res.status(400).send({ message: "Filter bulan dan tahun wajib diisi." });
        }

        let santriWhereClause = {};
        if (id_kelas) santriWhereClause.id_kelas = id_kelas;
        if (jenis_kelamin) santriWhereClause.jenis_kelamin = jenis_kelamin;
        
        const santriList = await Santri.findAll({
            where: santriWhereClause,
            include: [{ model: Kelas, attributes: ['nama_kelas'] }],
            attributes: ['id_santri', 'nama', 'jenis_kelamin'],
            order: [['nama', 'ASC']]
        });

        if (santriList.length === 0) {
            return res.status(200).send([]);
        }

        const santriIds = santriList.map(s => s.id_santri);

        const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
        const endDate = new Date(tahun, bulan, 0);
        const dateWhereClause = {
            tanggal: { [Op.between]: [startDate, endDate] }
        };

        const rekapKegiatan = await AbsenKegiatan.findAll({
            where: { id_santri: { [Op.in]: santriIds }, ...dateWhereClause },
            attributes: [
                'id_santri',
                [Sequelize.fn('COUNT', Sequelize.col('id_absen_kegiatan')), 'total'],
                [Sequelize.literal(`SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END)`), 'hadir']
            ],
            group: ['id_santri'],
            raw: true
        });

        const rekapSekolah = await AbsenSekolah.findAll({
            where: { id_santri: { [Op.in]: santriIds }, ...dateWhereClause },
            attributes: [
                'id_santri',
                [Sequelize.fn('COUNT', Sequelize.col('id_absen_sekolah')), 'total'],
                [Sequelize.literal(`SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END)`), 'hadir']
            ],
            group: ['id_santri'],
            raw: true
        });

        const finalRekap = santriList.map(santri => {
            const kegiatan = rekapKegiatan.find(r => r.id_santri === santri.id_santri) || { hadir: 0, total: 0 };
            const sekolah = rekapSekolah.find(r => r.id_santri === santri.id_santri) || { hadir: 0, total: 0 };

            return {
                id_santri: santri.id_santri,
                nama: santri.nama,
                jenis_kelamin: santri.jenis_kelamin, 
                nama_kelas: santri.Kela ? santri.Kela.nama_kelas : 'N/A',
                performa_asrama: calculatePerformance(parseInt(kegiatan.hadir) || 0, parseInt(kegiatan.total) || 0),
                performa_sekolah: calculatePerformance(parseInt(sekolah.hadir) || 0, parseInt(sekolah.total) || 0)
            };
        });

        res.status(200).send(finalRekap);

    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil rekap absensi.", error: error.message });
    }
};

// --- ▼▼▼ 2. MODIFIKASI FUNGSI INI ▼▼▼ ---
exports.getDetailAbsensiSantri = async (req, res) => {
    if (req.user.jabatan !== 'direktur') {
        return res.status(403).send({ message: "Akses ditolak! Membutuhkan peran Direktur." });
    }
    
    try {
        const { id_santri } = req.params;
        const { bulan, tahun } = req.query;

        if (!bulan || !tahun) {
            return res.status(400).send({ message: "Filter bulan dan tahun wajib diisi." });
        }

        const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
        const endDate = new Date(tahun, bulan, 0);

        const dateWhereClause = {
            tanggal: { [Op.between]: [startDate, endDate] }
        };

        // --- QUERY DIPERBARUI UNTUK MENGAMBIL NAMA KEGIATAN ---
        const absensiKegiatan = await AbsenKegiatan.findAll({
            where: { id_santri, ...dateWhereClause },
            include: [{
                model: Kegiatan,
                attributes: ['nama'],
                required: false // LEFT JOIN
            }],
            attributes: [
                'id_absen_kegiatan',
                'tanggal',
                'status',
                'id_kegiatan_unik', // Tetap ambil untuk fallback
                [
                    Sequelize.literal(`
                        CASE
                            WHEN Kegiatan.nama IS NOT NULL THEN Kegiatan.nama
                            ELSE REPLACE(SUBSTRING_INDEX(id_kegiatan_unik, '-', -1), '_', ' ')
                        END
                    `),
                    'nama_kegiatan'
                ]
            ],
            order: [['tanggal', 'DESC']],
            raw: true, // Tambahkan ini agar hasilnya object JS biasa
            nest: true,
        });
        
        const absensiSekolah = await AbsenSekolah.findAll({
            where: { id_santri, ...dateWhereClause },
            include: [{model: JamPelajaran, attributes: ['nama_jam', 'jam_mulai', 'jam_selesai']}],
            order: [['tanggal', 'DESC']]
        });

        const santri = await Santri.findByPk(id_santri, { attributes: ['nama'] });

        res.status(200).send({
            santri,
            absensiKegiatan,
            absensiSekolah
        });

    } catch (error) {
        console.error("Error fetching detail absensi:", error); // Log error
        res.status(500).send({ message: "Gagal mengambil detail absensi santri.", error: error.message });
    }
};

