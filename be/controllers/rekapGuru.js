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

// --- DIUBAH: Fungsi ini sekarang bisa menerima filter 'tingkat' ---
exports.getRekapGuruDetail = async (req, res) => {
    const { id_pegawai } = req.params;
    const { bulan, tahun, tingkat } = req.query; // Ambil 'tingkat' dari query

    if (!bulan || !tahun) {
        return res.status(400).send({ message: "Parameter bulan dan tahun diperlukan." });
    }

    try {
        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const whereClause = {
            id_pegawai: id_pegawai,
            tanggal: { [Op.between]: [startDate, endDate] }
        };

        const includeClause = [{
            model: JamPelajaran,
            attributes: ['nama_jam'],
            required: true
        }];

        // Jika ada filter tingkat, tambahkan join dan where clause yang sesuai
        if (tingkat === 'mts' || tingkat === 'ma') {
            const idKelasRange = tingkat === 'mts' ? { [Op.between]: [1, 3] } : { [Op.between]: [4, 6] };
            includeClause.push({
                model: KelasSekolah,
                required: true,
                attributes: [],
                include: [{
                    model: Kelas,
                    as: 'tingkatan',
                    required: true,
                    attributes: [],
                    where: { id_kelas: idKelasRange }
                }]
            });
        }

        const absensi = await AbsenSekolah.findAll({
            where: whereClause,
            include: includeClause,
            attributes: ['tanggal', 'id_jam_pelajaran'],
            order: [['tanggal', 'ASC']]
        });

        const rekapProses = absensi.reduce((acc, curr) => {
            const tanggal = curr.tanggal;
            const jam = curr.JamPelajaran.nama_jam;
            if (!acc[tanggal]) acc[tanggal] = [];
            if (!acc[tanggal].includes(jam)) { // Hindari duplikat jika ada
                acc[tanggal].push(jam);
            }
            return acc;
        }, {});

        // Ambil semua jam pelajaran untuk header tabel modal
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


// Fungsi untuk mengambil semua rekap (tidak diubah)
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
                    as: 'tingkatan',
                    required: true,
                    attributes: ['id_kelas']
                }]
            }],
            attributes: ['id_pegawai', 'id_jam_pelajaran', 'tanggal'],
            distinct: true,
        });

        const rekapData = absensi.map(absen => {
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