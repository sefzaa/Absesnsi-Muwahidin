// controllers/rekapWaliKamar.js
const { 
    Santri, 
    Kelas, 
    Kamar, 
    Asrama, 
    Prestasi, 
    Hafalan, 
    Tahfidz, 
    Surah,
    PelanggaranAsrama,
    DetailPelanggaranAsrama,
    IzinAsrama,
    DetailIzinAsrama,
    AbsenKegiatan,
    Kegiatan,
    sequelize 
} = require('../models');
const { Op } = require('sequelize');

// Fungsi untuk mendapatkan daftar semua santri
const getSantriList = async (req, res) => {
    try {
        const santri = await Santri.findAll({
            attributes: ['id_santri', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(santri);
    } catch (error) {
        console.error("Gagal mengambil daftar santri:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Fungsi untuk mendapatkan semua detail rekap per santri
const getDetailRekap = async (req, res) => {
    try {
        const { id_santri } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Rentang tanggal harus disediakan." });
        }

        const dateFilter = { [Op.between]: [new Date(startDate), new Date(endDate)] };

        // --- PERUBAHAN DI SINI: Memastikan semua atribut santri diambil ---
        const santriData = await Santri.findByPk(id_santri, {
            include: [
                { model: Kelas, attributes: ['nama_kelas'] },
                { model: Kamar, attributes: ['nomor_kamar'], include: { model: Asrama, attributes: ['nama_gedung'] } }
            ]
        });

        if (!santriData) {
            return res.status(404).json({ message: "Santri tidak ditemukan" });
        }

        const [prestasi, hafalan, tahfidz, pelanggaran, perizinan, absensi] = await Promise.all([
            Prestasi.findAll({ where: { id_santri, tanggal: dateFilter }, order: [['tanggal', 'DESC']] }),
            Hafalan.findAll({ where: { id_santri, tanggal: dateFilter }, order: [['tanggal', 'DESC']] }),
            Tahfidz.findAll({ where: { id_santri, tanggal: dateFilter }, include: [{ model: Surah, attributes: ['nama'] }], order: [['createdAt', 'DESC']] }),
            DetailPelanggaranAsrama.findAll({ where: { id_santri, tanggal: dateFilter }, include: [{ model: PelanggaranAsrama, attributes: ['nama'] }], order: [['tanggal', 'DESC']] }),
            DetailIzinAsrama.findAll({ where: { id_santri, tanggal_awal: dateFilter }, include: [{ model: IzinAsrama, attributes: ['jenis'] }], order: [['tanggal_awal', 'DESC']] }),
            AbsenKegiatan.findAll({ where: { id_santri, tanggal: dateFilter }, include: [{ model: Kegiatan, attributes: ['nama'] }], order: [['tanggal', 'DESC']] })
        ]);

        const totalAbsen = absensi.length;
        const totalHadir = absensi.filter(a => a.status === 'Hadir').length;
        const performaAbsensi = totalAbsen > 0 ? ((totalHadir / totalAbsen) * 100).toFixed(0) : 100;

        res.status(200).json({
            santri: santriData,
            prestasi,
            hafalan,
            tahfidz,
            pelanggaran,
            perizinan,
            absensi: {
                list: absensi,
                performa: performaAbsensi
            }
        });

    } catch (error) {
        console.error(`Gagal mengambil rekap untuk santri ${req.params.id_santri}:`, error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getSantriList,
    getDetailRekap
};
