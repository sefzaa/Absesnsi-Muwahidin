const db = require('../models');
const { Op } = require('sequelize');
const Santri = db.Santri;
const KelasSekolah = db.KelasSekolah;
const JamPelajaran = db.JamPelajaran;
const AbsenSekolah = db.AbsenSekolah;
const Pegawai = db.Pegawai;
const AbsenGuru = db.AbsenGuru; // <-- 1. Impor model AbsenGuru
const Sequelize = db.Sequelize;

// Mendapatkan semua kelas sekolah
exports.getKelasSekolah = async (req, res) => {
    try {
        const kelas = await KelasSekolah.findAll({
            order: [['nama_kelas_sekolah', 'ASC']],
        });
        res.status(200).send(kelas);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Mendapatkan semua jam pelajaran beserta status absensi untuk kelas tertentu
exports.getJamPelajaran = async (req, res) => {
    const { id_kelas_sekolah, tanggal } = req.query;
    if (!id_kelas_sekolah || !tanggal) {
        return res.status(400).send({ message: "Parameter id_kelas_sekolah dan tanggal diperlukan." });
    }

    try {
        const jamPelajaran = await JamPelajaran.findAll({
            order: [['jam_mulai', 'ASC']],
        });

        const jamPelajaranWithStatus = await Promise.all(
            jamPelajaran.map(async (jam) => {
                const absensi = await AbsenSekolah.findOne({
                    where: {
                        id_kelas_sekolah: id_kelas_sekolah,
                        id_jam_pelajaran: jam.id_jam_pelajaran,
                        tanggal: tanggal,
                    },
                });
                return {
                    ...jam.toJSON(),
                    selesai: !!absensi,
                };
            })
        );

        res.status(200).send(jamPelajaranWithStatus);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Mendapatkan santri berdasarkan kelas sekolah
exports.getSantriByKelas = async (req, res) => {
    try {
        const santri = await Santri.findAll({
            where: {
                id_kelas_sekolah: req.params.id_kelas_sekolah,
                status_aktif: true
            },
            order: [['nama', 'ASC']],
        });
        res.status(200).send(santri);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

// Mengambil detail absensi yang sudah ada
exports.getAbsensiDetail = async (req, res) => {
    const { id_kelas_sekolah, tanggal, id_jam_pelajaran } = req.query;

    if (!id_kelas_sekolah || !tanggal || !id_jam_pelajaran) {
        return res.status(400).send({ message: "Parameter id_kelas_sekolah, tanggal, dan id_jam_pelajaran diperlukan." });
    }

    try {
        const absensi = await AbsenSekolah.findAll({
            where: {
                id_kelas_sekolah: id_kelas_sekolah,
                tanggal: tanggal,
                id_jam_pelajaran: id_jam_pelajaran
            },
            attributes: ['id_santri', 'status']
        });
        res.status(200).send(absensi);
    } catch (error) {
        res.status(500).send({ message: error.message || "Gagal mengambil detail absensi." });
    }
};

// Menyimpan atau memperbarui data absensi (UPSERT)
exports.saveAbsensi = async (req, res) => {
    // Di sini, id_pegawai diambil dari token, bukan dari body, untuk keamanan
    const id_pegawai_guru = req.user.id_pegawai;
    const { id_kelas_sekolah, tanggal, absensi } = req.body;

    if (!id_kelas_sekolah || !id_pegawai_guru || !tanggal || !absensi || absensi.length === 0) {
        return res.status(400).send({ message: "Data tidak lengkap." });
    }

    const t = await db.sequelize.transaction();

    try {
        const absensiData = absensi.map(item => ({
            id_kelas_sekolah,
            id_pegawai: id_pegawai_guru, // Menggunakan id dari token
            tanggal,
            id_santri: item.id_santri,
            status: item.status,
            id_jam_pelajaran: item.id_jam_pelajaran
        }));
        
        // Simpan absensi santri
        const createdAbsenSekolah = await AbsenSekolah.bulkCreate(absensiData, {
            updateOnDuplicate: ["status", "id_pegawai"], // Jika ada data, update statusnya
            transaction: t,
            returning: true
        });

        // --- ▼▼▼ 2. LOGIKA BARU: REKAP OTOMATIS ABSENSI GURU ▼▼▼ ---
        // Dapatkan semua ID jam pelajaran yang unik dari input absensi
        const uniqueJamPelajaranIds = [...new Set(absensi.map(item => item.id_jam_pelajaran))];

        // Buat promise untuk setiap jam pelajaran yang diabsen
        const rekapGuruPromises = uniqueJamPelajaranIds.map(id_jam => {
            return AbsenGuru.findOrCreate({
                where: {
                    id_pegawai: id_pegawai_guru,
                    id_jam_pelajaran: id_jam,
                    tanggal: tanggal
                },
                defaults: {
                    status: 'Hadir',
                    id_absen_sekolah: createdAbsenSekolah.find(a => a.id_jam_pelajaran === id_jam)?.id_absen_sekolah
                },
                transaction: t
            });
        });

        // Jalankan semua promise rekap guru
        await Promise.all(rekapGuruPromises);
        // --- ▲▲▲ AKHIR LOGIKA BARU ---

        await t.commit();
        res.status(201).send({ message: "Absensi santri dan kehadiran guru berhasil direkam." });
    } catch (error) {
        await t.rollback();
        console.error("Kesalahan saat menyimpan absensi:", error);
        res.status(500).send({ message: error.message || "Terjadi kesalahan saat menyimpan absensi." });
    }
};

// Mengambil semua data summary
exports.getSummary = async (req, res) => {
    const { tanggal } = req.query;
    if (!tanggal) {
        return res.status(400).send({ message: "Parameter tanggal diperlukan." });
    }

    try {
        const studentCounts = await Santri.findAll({
            attributes: [
                'id_kelas_sekolah',
                [Sequelize.fn('COUNT', Sequelize.col('id_santri')), 'total_santri'],
            ],
            where: { 
                status_aktif: true,
                id_kelas_sekolah: { [Op.ne]: null }
            },
            group: ['id_kelas_sekolah'],
            raw: true,
        });
        const totalSantriMap = new Map(studentCounts.map(i => [i.id_kelas_sekolah, i.total_santri]));

        const summaries = await AbsenSekolah.findAll({
            where: { tanggal },
            attributes: [
                'id_kelas_sekolah',
                'id_jam_pelajaran',
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Hadir' THEN 1 END")), 'hadir'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Sakit' THEN 1 END")), 'sakit'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Izin' THEN 1 END")), 'izin'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Alpa' THEN 1 END")), 'alpa'],
            ],
            include: [
                { model: JamPelajaran, attributes: ['nama_jam'], required: true },
                { model: Pegawai, attributes: ['nama'], required: true } // Dihapus alias 'Pegawai'
            ],
            group: [
                'id_kelas_sekolah',
                'id_jam_pelajaran',
                'JamPelajaran.id_jam_pelajaran',
                'Pegawai.id_pegawai'
            ],
            order: [[JamPelajaran, 'jam_mulai', 'ASC']]
        });
        
        const result = {};
        summaries.forEach(summary => {
            const data = summary.toJSON();
            const kelasId = data.id_kelas_sekolah;

            if (!result[kelasId]) {
                result[kelasId] = {
                    totalSantri: totalSantriMap.get(kelasId) || 0,
                    summary: [],
                };
            }
            
            result[kelasId].summary.push({
                id_jam_pelajaran: data.id_jam_pelajaran,
                nama_jam: data.JamPelajaran.nama_jam,
                hadir: data.hadir,
                sakit: data.sakit,
                izin: data.izin,
                alpa: data.alpa,
                penginput: data.Pegawai.nama,
            });
        });

        res.status(200).send(result);
    } catch (error) {
        console.error("Error fetching summary:", error);
        res.status(500).send({ message: "Gagal mengambil data ringkasan." });
    }
};
