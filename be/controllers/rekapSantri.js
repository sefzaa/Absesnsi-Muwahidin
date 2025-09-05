// file: controllers/rekap.js
const { Santri, Kelas, AbsenKegiatan, Pegawai, KelasMusyrif, sequelize } = require('../models');
const { Op } = require('sequelize');

// FUNGSI BARU: Mengambil hanya santri yang diasuh musyrif
const getSantriAsuhan = async (req, res) => {
    try {
        const { id_pegawai, jenis_kelamin: jenisKelaminMusyrif } = req.user;

        let targetJenisKelaminSantri;
        if (jenisKelaminMusyrif === 'Laki-laki' || jenisKelaminMusyrif === 'Putra') {
            targetJenisKelaminSantri = 'Putra';
        } else if (jenisKelaminMusyrif === 'Perempuan' || jenisKelaminMusyrif === 'Putri') {
            targetJenisKelaminSantri = 'Putri';
        }

        const kelasAsuhan = await KelasMusyrif.findAll({
            where: { id_pegawai },
            attributes: ['id_kelas']
        });
        const kelasIds = kelasAsuhan.map(k => k.id_kelas);

        const santri = await Santri.findAll({
            where: {
                id_kelas: { [Op.in]: kelasIds },
                jenis_kelamin: targetJenisKelaminSantri,
                status_aktif: true
            },
            attributes: ['id_santri', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(santri);
    } catch (error) {
        console.error("Gagal mengambil daftar santri asuhan:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// FUNGSI YANG DIPERBAIKI: Mengambil detail rekap
const getDetailRekap = async (req, res) => {
    try {
        const { id_santri } = req.params;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Rentang tanggal harus disediakan." });
        }
        const dateFilter = { [Op.between]: [new Date(startDate), new Date(endDate)] };

        const santriData = await Santri.findByPk(id_santri, {
            include: [{ model: Kelas, attributes: ['nama_kelas'] }]
        });

        if (!santriData) {
            return res.status(404).json({ message: "Santri tidak ditemukan" });
        }

        // Ambil data absensi
        const absensiRaw = await AbsenKegiatan.findAll({ 
            where: { id_santri, tanggal: dateFilter }, 
            order: [['tanggal', 'DESC'], ['id_kegiatan_unik', 'DESC']] 
        });

        // PERBAIKAN: Proses nama kegiatan secara manual
        const absensiList = absensiRaw.map(absen => {
            const namaKegiatan = (absen.id_kegiatan_unik.split('-').pop() || '').replace(/_/g, ' ');
            return {
                ...absen.toJSON(),
                kegiatan_nama: namaKegiatan.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
            };
        });

        const totalAbsen = absensiList.length;
        const totalHadir = absensiList.filter(a => a.status === 'Hadir').length;
        const performaAbsensi = totalAbsen > 0 ? ((totalHadir / totalAbsen) * 100).toFixed(0) : 100;

        // Note: Data lain seperti prestasi, pelanggaran, dll. bisa ditambahkan kembali di sini jika sudah siap
        res.status(200).json({
            santri: santriData,
            absensi: {
                list: absensiList,
                performa: performaAbsensi
            },
            // prestasi, hafalan, dll.
        });

    } catch (error) {
        console.error(`Gagal mengambil rekap untuk santri ${req.params.id_santri}:`, error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getSantriAsuhan, // Mengganti getSantriList
    getDetailRekap
};