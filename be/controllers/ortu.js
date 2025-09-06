// file: controllers/ortu.controller.js
const db = require('../models');
const { Op } = require('sequelize');
const Santri = db.Santri;
const Ortu = db.Ortu;
const AbsenKegiatan = db.AbsenKegiatan;
const AbsenSekolah = db.AbsenSekolah;
const Kegiatan = db.Kegiatan;
const JamPelajaran = db.JamPelajaran;

// Fungsi untuk mendapatkan daftar anak dari orang tua yang login
exports.getAnakList = async (req, res) => {
    try {
        // req.user didapat dari middleware verifyToken
        const ortu = await Ortu.findOne({ where: { id_user: req.user.id_user } });
        if (!ortu) {
            return res.status(404).send({ message: "Data orang tua tidak ditemukan." });
        }

        const anakList = await Santri.findAll({
            where: { id_ortu: ortu.id_ortu },
            attributes: ['id_santri', 'nama'],
            order: [['nama', 'ASC']]
        });

        res.status(200).send(anakList);
    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil data anak: " + error.message });
    }
};

// Fungsi untuk mendapatkan detail absensi seorang anak
exports.getAbsensiDetail = async (req, res) => {
    try {
        const { id_santri } = req.params;
        const { bulan, tahun } = req.query;

        if (!bulan || !tahun) {
            return res.status(400).send({ message: "Filter bulan dan tahun diperlukan." });
        }

        // Validasi kepemilikan: pastikan santri adalah anak dari ortu yang login
        const ortu = await Ortu.findOne({ where: { id_user: req.user.id_user } });
        const santri = await Santri.findOne({ where: { id_santri, id_ortu: ortu.id_ortu } });

        if (!santri) {
            return res.status(403).send({ message: "Akses ditolak. Anda bukan wali dari santri ini." });
        }

        const startDate = new Date(tahun, bulan - 1, 1);
        const endDate = new Date(tahun, bulan, 0);

        const absensiKegiatan = await AbsenKegiatan.findAll({
            where: {
                id_santri,
                tanggal: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                { model: Kegiatan, attributes: ['nama'], required: false }
            ],
            order: [['tanggal', 'DESC']]
        });
        
        // Memformat nama kegiatan agar lebih baik
        const formattedAbsensiKegiatan = absensiKegiatan.map(absen => {
            let nama_kegiatan = 'Kegiatan Rutin';
            if (absen.Kegiatan) {
                nama_kegiatan = absen.Kegiatan.nama;
            } else if (absen.id_kegiatan_unik.startsWith('rutin-')) {
                 // Ekstrak nama dari id unik, contoh: rutin-1-2025-09-02-Shalat_Subuh -> Shalat Subuh
                nama_kegiatan = absen.id_kegiatan_unik.split('-').slice(3).join(' ').replace(/_/g, ' ');
            }
            return {
                id_absen_kegiatan: absen.id_absen_kegiatan,
                tanggal: absen.tanggal,
                status: absen.status,
                nama_kegiatan: nama_kegiatan
            };
        });


        const absensiSekolah = await AbsenSekolah.findAll({
            where: {
                id_santri,
                tanggal: {
                    [Op.between]: [startDate, endDate]
                }
            },
            include: [
                { model: JamPelajaran, attributes: ['nama_jam', 'jam_mulai', 'jam_selesai'] }
            ],
            order: [['tanggal', 'DESC'], ['id_jam_pelajaran', 'ASC']]
        });
        
        res.status(200).send({
            absensiKegiatan: formattedAbsensiKegiatan,
            absensiSekolah,
        });

    } catch (error) {
        res.status(500).send({ message: "Gagal mengambil data absensi: " + error.message });
    }
};
