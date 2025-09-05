// file: controllers/riwayatAbsen.js
const db = require('../models');
const { Op } = require('sequelize');
const AbsenSekolah = db.AbsenSekolah;
const KelasSekolah = db.KelasSekolah;
const Santri = db.Santri;
const JamPelajaran = db.JamPelajaran;
const Pegawai = db.Pegawai;
const Sequelize = db.Sequelize;

// Fungsi helper untuk mendapatkan id_user dari request secara aman
const getUserIdFromRequest = (req) => {
    if (req.user && req.user.id_user) return req.user.id_user;
    return null;
};

// Endpoint 1: Mendapatkan daftar kelas unik yang pernah diajar oleh seorang guru
exports.getKelasRiwayat = async (req, res) => {
    const { id_pegawai } = req.user;

    if (!id_pegawai) {
        return res.status(403).send({ message: "Akses ditolak. Anda bukan seorang pegawai." });
    }

    try {
        const kelasList = await AbsenSekolah.findAll({
            where: { id_pegawai },
            attributes: [],
            include: [{
                model: KelasSekolah,
                attributes: [
                    // Sequelize akan secara otomatis memberi nama alias 'KelasSekolah.id_kelas_sekolah' saat raw:true
                    [Sequelize.fn('DISTINCT', Sequelize.col('KelasSekolah.id_kelas_sekolah')), 'id_kelas_sekolah'],
                    'nama_kelas_sekolah'
                ],
                required: true
            }],
            group: ['KelasSekolah.id_kelas_sekolah', 'KelasSekolah.nama_kelas_sekolah'],
            raw: true,
        });

        // --- INI BAGIAN PERBAIKAN FINAL ---
        // Saat menggunakan raw:true dan include, kita harus mengakses kolom dengan nama modelnya.
        const cleanedList = kelasList.map(k => ({
            id_kelas_sekolah: k['KelasSekolah.id_kelas_sekolah'], // Menggunakan nama yang benar
            nama_kelas_sekolah: k['KelasSekolah.nama_kelas_sekolah']  // Menggunakan nama yang benar
        }));

        res.status(200).send(cleanedList);
    } catch (error) {
        console.error("Error fetching class history:", error);
        res.status(500).send({ message: "Gagal mengambil riwayat kelas." });
    }
};

// Endpoint 2: Mendapatkan performa semua santri di kelas tertentu oleh guru tersebut
exports.getSantriPerformance = async (req, res) => {
    const { id_pegawai } = req.user;
    const { id_kelas_sekolah } = req.query;

    if (!id_pegawai) {
        return res.status(403).send({ message: "Akses ditolak. Anda bukan seorang pegawai." });
    }
    if (!id_kelas_sekolah) {
        return res.status(400).send({ message: "Parameter id_kelas_sekolah diperlukan." });
    }
    
    try {
        const santriList = await Santri.findAll({
            where: { id_kelas_sekolah, status_aktif: true },
            attributes: ['id_santri', 'nama'],
            order: [['nama', 'ASC']]
        });

        const stats = await AbsenSekolah.findAll({
            where: { id_pegawai, id_kelas_sekolah },
            attributes: [
                'id_santri',
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Hadir' THEN 1 END")), 'hadir'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Sakit' THEN 1 END")), 'sakit'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Izin' THEN 1 END")), 'izin'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Alpa' THEN 1 END")), 'alpa'],
            ],
            group: ['id_santri']
        });

        const statsMap = new Map(stats.map(s => [s.id_santri, s.toJSON()]));

        const performanceData = santriList.map(santri => {
            const santriStats = statsMap.get(santri.id_santri);
            const hadir = santriStats ? parseInt(santriStats.hadir, 10) : 0;
            const sakit = santriStats ? parseInt(santriStats.sakit, 10) : 0;
            const izin = santriStats ? parseInt(santriStats.izin, 10) : 0;
            const alpa = santriStats ? parseInt(santriStats.alpa, 10) : 0;
            const total = hadir + sakit + izin + alpa;
            const percentage = total > 0 ? (hadir / total) * 100 : 0;

            return {
                id_santri: santri.id_santri,
                nama: santri.nama,
                hadir,
                sakit,
                izin,
                alpa,
                total,
                percentage: Math.round(percentage)
            };
        });

        res.status(200).send(performanceData);
    } catch (error) {
        console.error("Error fetching santri performance:", error);
        res.status(500).send({ message: "Gagal mengambil data performa santri." });
    }
};

// Endpoint 3: Mendapatkan detail riwayat absen seorang santri oleh guru tersebut
exports.getDetailRiwayatSantri = async (req, res) => {
    const { id_pegawai } = req.user;
    const { id_santri } = req.query;

    if (!id_pegawai) {
        return res.status(403).send({ message: "Akses ditolak. Anda bukan seorang pegawai." });
    }
    if (!id_santri) {
        return res.status(400).send({ message: "Parameter id_santri diperlukan." });
    }
    
    try {
        const history = await AbsenSekolah.findAll({
            where: { id_pegawai, id_santri },
            attributes: ['tanggal', 'status'],
            include: [{
                model: JamPelajaran,
                attributes: ['nama_jam'],
                required: true
            }],
            order: [['tanggal', 'DESC'], [db.JamPelajaran, 'jam_mulai', 'DESC']]
        });
        res.status(200).send(history);
    } catch (error) {
        console.error("Error fetching santri detail history:", error);
        res.status(500).send({ message: "Gagal mengambil detail riwayat." });
    }
};