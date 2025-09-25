// controllers/direktur.js

const db = require('../models');
const { Santri, Kelas, AbsenKegiatan, AbsenSekolah, JamPelajaran, Kegiatan } = db;
const { Op, Sequelize } = require('sequelize');

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
            where: {
                nama_kelas: { [Op.ne]: 'Alumni' }
            },
            attributes: ['id_kelas', 'nama_kelas'],
            order: [['id_kelas', 'ASC']]
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
            include: [{ 
                model: Kelas, 
                attributes: ['nama_kelas'],
                where: { nama_kelas: { [Op.ne]: 'Alumni' } }
            }],
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

        // REVISI: Query diubah untuk menghitung H, I, S, A
        const rekapKegiatan = await AbsenKegiatan.findAll({
            where: { id_santri: { [Op.in]: santriIds }, ...dateWhereClause },
            attributes: [
                'id_santri',
                [Sequelize.fn('COUNT', Sequelize.col('id_absen_kegiatan')), 'total'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END)"), 'hadir'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END)"), 'izin'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END)"), 'sakit'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Alpa' THEN 1 ELSE 0 END)"), 'alpa']
            ],
            group: ['id_santri'],
            raw: true
        });

        // REVISI: Query diubah untuk menghitung H, I, S, A
        const rekapSekolah = await AbsenSekolah.findAll({
            where: { id_santri: { [Op.in]: santriIds }, ...dateWhereClause },
            attributes: [
                'id_santri',
                [Sequelize.fn('COUNT', Sequelize.col('id_absen_sekolah')), 'total'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Hadir' THEN 1 ELSE 0 END)"), 'hadir'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Izin' THEN 1 ELSE 0 END)"), 'izin'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Sakit' THEN 1 ELSE 0 END)"), 'sakit'],
                [Sequelize.literal("SUM(CASE WHEN status = 'Alpa' THEN 1 ELSE 0 END)"), 'alpa']
            ],
            group: ['id_santri'],
            raw: true
        });

        // REVISI: Struktur data yang dikirim ke frontend diubah
        const finalRekap = santriList.map(santri => {
            const kegiatan = rekapKegiatan.find(r => r.id_santri === santri.id_santri) || { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
            const sekolah = rekapSekolah.find(r => r.id_santri === santri.id_santri) || { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };

            return {
                id_santri: santri.id_santri,
                nama: santri.nama,
                jenis_kelamin: santri.jenis_kelamin, 
                nama_kelas: santri.Kela ? santri.Kela.nama_kelas : 'N/A',
                rekap_asrama: {
                    H: parseInt(kegiatan.hadir) || 0,
                    I: parseInt(kegiatan.izin) || 0,
                    S: parseInt(kegiatan.sakit) || 0,
                    A: parseInt(kegiatan.alpa) || 0,
                    performa: calculatePerformance(parseInt(kegiatan.hadir) || 0, parseInt(kegiatan.total) || 0)
                },
                rekap_sekolah: {
                    H: parseInt(sekolah.hadir) || 0,
                    I: parseInt(sekolah.izin) || 0,
                    S: parseInt(sekolah.sakit) || 0,
                    A: parseInt(sekolah.alpa) || 0,
                    performa: calculatePerformance(parseInt(sekolah.hadir) || 0, parseInt(sekolah.total) || 0)
                }
            };
        });

        res.status(200).send(finalRekap);

    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil rekap absensi.", error: error.message });
    }
};

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

        const absensiKegiatan = await AbsenKegiatan.findAll({
            where: { id_santri, ...dateWhereClause },
            include: [{
                model: Kegiatan,
                attributes: ['nama'],
                required: false
            }],
            attributes: [
                'id_absen_kegiatan', 'tanggal', 'status', 'id_kegiatan_unik',
                [ Sequelize.literal(`COALESCE(\`Kegiatan\`.\`nama\`, REPLACE(SUBSTRING_INDEX(id_kegiatan_unik, '-', -1), '_', ' '))`), 'nama_kegiatan' ]
            ],
            order: [['tanggal', 'DESC']],
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
        console.error("Error fetching detail absensi:", error);
        res.status(500).send({ message: "Gagal mengambil detail absensi santri.", error: error.message });
    }
};