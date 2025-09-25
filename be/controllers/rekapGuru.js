// controllers/rekapGuru.js
const db = require('../models');
const { Op } = require('sequelize');
const Pegawai = db.Pegawai;
const Jabatan = db.Jabatan;
const AbsenSekolah = db.AbsenSekolah;
const JamPelajaran = db.JamPelajaran;
const KelasSekolah = db.KelasSekolah;
const Kelas = db.Kelas; // Impor model Kelas

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

        const absensi = await AbsenSekolah.findAll({
            where: {
                id_pegawai: id_pegawai,
                tanggal: { [Op.between]: [startDate, endDate] }
            },
            include: [{
                model: JamPelajaran,
                attributes: ['nama_jam'],
                required: true
            }],
            attributes: ['tanggal', 'id_jam_pelajaran'],
            order: [['tanggal', 'ASC']]
        });

        const rekapProses = absensi.reduce((acc, curr) => {
            const tanggal = curr.tanggal;
            const jam = curr.JamPelajaran.nama_jam;
            if (!acc[tanggal]) acc[tanggal] = [];
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

// --- FUNGSI INI DIREVISI UNTUK MENAMBAHKAN INFORMASI JENJANG ---
exports.getRekapUntukSemuaGuru = async (req, res) => {
    const { bulan, tahun } = req.query;

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const gurus = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama', 'nip'],
            include: [{ model: Jabatan, where: { nama_jabatan: 'Guru' }, attributes: [] }],
            order: [['nama', 'ASC']]
        });

        const jamPelajaran = await JamPelajaran.findAll({
            attributes: ['id_jam_pelajaran', 'nama_jam'],
            order: [['jam_mulai', 'ASC']]
        });

        const absensi = await AbsenSekolah.findAll({
            where: {
                tanggal: { [Op.between]: [startDate, endDate] },
                id_pegawai: { [Op.not]: null }
            },
            include: [{
                model: KelasSekolah,
                required: true,
                attributes: ['id_kelas_sekolah'],
                include: [{
                    model: Kelas,
                    as: 'tingkatan', // <-- PERBAIKAN 1: Menggunakan alias 'tingkatan' sesuai log error
                    required: true,
                    attributes: ['id_kelas']
                }]
            }],
            attributes: ['id_pegawai', 'id_jam_pelajaran', 'tanggal'],
            distinct: true,
        });

        const rekapData = absensi.map(absen => {
            // <-- PERBAIKAN 2: Mengakses data menggunakan alias 'tingkatan'
            const idKelas = absen.KelasSekolah?.tingkatan?.id_kelas;
            let tingkat = null;
            if (idKelas) {
                tingkat = (idKelas >= 1 && idKelas <= 3) ? 'mts' : (idKelas >= 4 && idKelas <= 6) ? 'ma' : null;
            }
            
            return {
                id_pegawai: absen.id_pegawai,
                id_jam_pelajaran: absen.id_jam_pelajaran,
                tanggal: absen.tanggal,
                tingkat: tingkat
            };
        }).filter(item => item.tingkat !== null);

        res.status(200).json({ gurus, jamPelajaran, rekapData });

    } catch (error) {
        console.error("Error fetching all guru recap:", error);
        res.status(500).send({ message: "Gagal mengambil data rekap untuk diunduh." });
    }
};