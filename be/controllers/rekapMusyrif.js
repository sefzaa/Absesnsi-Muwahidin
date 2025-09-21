const db = require('../models');
const { Op } = require('sequelize');
const Pegawai = db.Pegawai;
const Jabatan = db.Jabatan;
const AbsenMusyrif = db.AbsenMusyrif;

// --- ▼▼▼ FUNGSI INI DIPERBAIKI SECARA MENYELURUH ▼▼▼ ---
// Fungsi ini sekarang menggunakan id_kegiatan_unik untuk mendapatkan nama yang akurat.
const getCleanNamaKegiatan = (id_unik) => {
    if (!id_unik) return 'Kegiatan Tidak Dikenal';
    
    const bagian = id_unik.split('-');

    if (id_unik.startsWith('rutin-')) {
        // Format: rutin-{id}-{YYYY-MM-DD}-{nama_kegiatan}
        // Contoh: rutin-1-2025-09-21-Shalat_Subuh
        // Nama kegiatan adalah bagian terakhir setelah tanda hubung.
        const namaKegiatan = bagian[bagian.length - 1];
        return namaKegiatan.replace(/_/g, ' '); // Mengganti '_' dengan spasi
    } 
    
    if (id_unik.startsWith('tambahan-')) {
        // Format: tambahan-{id}-{nama_kegiatan}
        // Contoh: tambahan-2-Seminar_Kebangsaan
        // Nama kegiatan adalah semua bagian setelah ID numerik.
        const namaKegiatan = bagian.slice(2).join('-');
        return namaKegiatan.replace(/_/g, ' '); // Mengganti '_' dengan spasi
    }
    
    // Fallback jika format tidak dikenali
    return id_unik;
};
// --- ▲▲▲ AKHIR PERBAIKAN ---


// Mengambil semua pegawai dengan jabatan 'Musyrif'
exports.getAllMusyrif = async (req, res) => {
    try {
        const musyrif = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama', 'nip'],
            include: [{
                model: Jabatan,
                where: { nama_jabatan: 'Musyrif' },
                attributes: []
            }],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(musyrif);
    } catch (error) {
        console.error("Error fetching musyrif list:", error);
        res.status(500).send({ message: "Gagal mengambil daftar musyrif." });
    }
};

// Mengambil data rekap absensi untuk satu musyrif berdasarkan bulan dan tahun
exports.getRekapMusyrifDetail = async (req, res) => {
    const { id_pegawai } = req.params;
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const absensi = await AbsenMusyrif.findAll({
            where: {
                id_pegawai: id_pegawai,
                tanggal: { [Op.between]: [startDate, endDate] }
            },
            // Ambil id_kegiatan_unik untuk diproses
            attributes: ['tanggal', 'id_kegiatan_unik'],
            order: [['tanggal', 'ASC']]
        });

        // Terapkan fungsi pembersihan pada setiap item
        const absensiBersih = absensi.map(a => ({
            tanggal: a.tanggal,
            nama_kegiatan: getCleanNamaKegiatan(a.id_kegiatan_unik)
        }));
        
        const semuaKegiatan = [...new Set(absensiBersih.map(a => a.nama_kegiatan))].sort();

        const rekapProses = absensiBersih.reduce((acc, curr) => {
            const tanggal = curr.tanggal;
            const kegiatan = curr.nama_kegiatan;
            if (!acc[tanggal]) {
                acc[tanggal] = [];
            }
            acc[tanggal].push(kegiatan);
            return acc;
        }, {});

        res.status(200).json({ rekap: rekapProses, kegiatan: semuaKegiatan });

    } catch (error) {
        console.error("Error fetching rekap musyrif detail:", error);
        res.status(500).send({ message: "Gagal mengambil detail rekap musyrif." });
    }
};


// Mengambil semua data untuk diunduh ke PDF
exports.getRekapForDownload = async (req, res) => {
    const { bulan, tahun } = req.query;
    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const allMusyrif = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama'],
            include: [{ model: Jabatan, where: { nama_jabatan: 'Musyrif' }, attributes: [] }],
            order: [['nama', 'ASC']]
        });

        const absensi = await AbsenMusyrif.findAll({
            where: {
                tanggal: { [Op.between]: [startDate, endDate] }
            },
            // Ambil id_kegiatan_unik untuk diproses
            attributes: ['id_pegawai', 'tanggal', 'id_kegiatan_unik', 'status'],
        });

        // Terapkan fungsi pembersihan pada setiap item
        const absensiBersih = absensi.map(a => ({
            ...a.toJSON(), // Salin semua properti asli
            nama_kegiatan: getCleanNamaKegiatan(a.id_kegiatan_unik)
        }));

        const semuaKegiatan = [...new Set(absensiBersih.map(a => a.nama_kegiatan))].sort();

        const rekapData = absensiBersih.reduce((acc, curr) => {
            const key = `${curr.id_pegawai}-${curr.nama_kegiatan}-${curr.tanggal}`;
            acc[key] = curr.status === 'Hadir' ? 'H' : '-';
            return acc;
        }, {});

        res.status(200).json({
            musyrifs: allMusyrif,
            kegiatan: semuaKegiatan,
            rekapData,
        });

    } catch (error) {
        console.error("Error fetching data for download:", error);
        res.status(500).send({ message: "Gagal mengambil data untuk diunduh." });
    }
};

