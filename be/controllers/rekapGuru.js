const db = require('../models');
const { Op } = require('sequelize');
const Pegawai = db.Pegawai;
const Jabatan = db.Jabatan;
const AbsenGuru = db.AbsenGuru;
const JamPelajaran = db.JamPelajaran;

// Mengambil semua pegawai dengan jabatan 'Guru'
exports.getAllGuru = async (req, res) => {
    try {
        const guru = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama', 'nip'],
            include: [{
                model: Jabatan,
                where: { nama_jabatan: 'Guru' },
                attributes: []
            }],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(guru);
    } catch (error) {
        console.error("Error fetching guru list:", error);
        res.status(500).send({ message: "Gagal mengambil daftar guru." });
    }
};

// Mengambil data rekap absensi untuk satu guru berdasarkan bulan dan tahun
exports.getRekapGuruDetail = async (req, res) => {
    const { id_pegawai } = req.params;
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const absensi = await AbsenGuru.findAll({
            where: {
                id_pegawai: id_pegawai,
                tanggal: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [{
                model: JamPelajaran,
                attributes: ['nama_jam'],
                required: true
            }],
            attributes: ['tanggal', 'id_jam_pelajaran'], // Tambahkan id_jam_pelajaran
            order: [['tanggal', 'ASC']]
        });

        // Proses data agar mudah di-render di frontend
        const rekapProses = absensi.reduce((acc, curr) => {
            const tanggal = curr.tanggal;
            const jam = curr.JamPelajaran.nama_jam;
            
            if (!acc[tanggal]) {
                acc[tanggal] = [];
            }
            acc[tanggal].push(jam);
            return acc;
        }, {});

        const semuaJamPelajaran = await JamPelajaran.findAll({
            attributes: ['id_jam_pelajaran', 'nama_jam'],
            order: [['jam_mulai', 'ASC']]
        });

        res.status(200).json({ rekap: rekapProses, jamPelajaran: semuaJamPelajaran });

    } catch (error) {
        console.error("Error fetching rekap guru detail:", error);
        res.status(500).send({ message: "Gagal mengambil detail rekap guru." });
    }
};

// --- ▼▼▼ FUNGSI BARU: Untuk mengambil semua data rekap untuk download ▼▼▼ ---
exports.getRekapUntukSemuaGuru = async (req, res) => {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        // 1. Ambil semua guru
        const gurus = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama', 'nip'],
            include: [{
                model: Jabatan,
                where: { nama_jabatan: 'Guru' },
                attributes: []
            }],
            order: [['nama', 'ASC']]
        });

        // 2. Ambil semua jam pelajaran
        const jamPelajaran = await JamPelajaran.findAll({
            attributes: ['id_jam_pelajaran', 'nama_jam'],
            order: [['jam_mulai', 'ASC']]
        });

        // 3. Ambil semua data absensi guru pada periode yang dipilih
        const absensi = await AbsenGuru.findAll({
            where: {
                tanggal: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: ['id_pegawai', 'id_jam_pelajaran', 'tanggal'],
        });

        // 4. Proses dan strukturkan data absensi untuk efisiensi
        const rekapData = absensi.reduce((acc, curr) => {
            const key = `${curr.id_pegawai}-${curr.id_jam_pelajaran}-${curr.tanggal}`;
            acc[key] = 'H'; // Tandai sebagai Hadir
            return acc;
        }, {});

        res.status(200).json({ gurus, jamPelajaran, rekapData });

    } catch (error) {
        console.error("Error fetching all guru recap:", error);
        res.status(500).send({ message: "Gagal mengambil data rekap untuk diunduh." });
    }
};
