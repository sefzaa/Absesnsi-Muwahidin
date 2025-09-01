// file: controllers/hafalan.js
const { Santri, Hafalan, Kamar } = require('../models');
const { Op } = require('sequelize');

// REVISI TOTAL: Mendapatkan daftar santri asuhan wali kamar, dikelompokkan per kamar
const getHafalanProgressByWaliKamar = async (req, res) => {
    try {
        const { id_wali_kamar } = req.user;
        if (!id_wali_kamar) {
            return res.status(403).json({ message: "Akses ditolak. Anda bukan Wali Kamar." });
        }

        const { search } = req.query;
        const santriWhereClause = search ? { nama: { [Op.like]: `%${search}%` } } : {};

        const santriList = await Santri.findAll({
            where: {
                ...santriWhereClause,
                status_aktif: true
            },
            include: [
                {
                    model: Kamar,
                    where: { id_wali_kamar },
                    attributes: ['id_kamar', 'nomor_kamar'],
                    required: true
                },
            ],
            order: [
                [Kamar, 'nomor_kamar', 'ASC'],
                ['nama', 'ASC']
            ]
        });

        // Kelompokkan hasil berdasarkan kamar
        const groupedByKamar = {};
        santriList.forEach(santri => {
            const kamarId = santri.Kamar.id_kamar;
            if (!groupedByKamar[kamarId]) {
                groupedByKamar[kamarId] = {
                    id_kamar: kamarId,
                    nomor_kamar: santri.Kamar.nomor_kamar,
                    santri: []
                };
            }
            
            groupedByKamar[kamarId].santri.push({
                id_santri: santri.id_santri,
                nama: santri.nama,
            });
        });

        const formattedData = Object.values(groupedByKamar);
        res.status(200).json(formattedData);

    } catch (error) {
        console.error("Gagal mengambil progres hafalan:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Mengambil riwayat hafalan dari tabel hafalan berdasarkan ID santri
const getHafalanHistory = async (req, res) => {
    const { id_santri } = req.params;
    try {
        const history = await Hafalan.findAll({
            where: { id_santri: id_santri },
            order: [['tanggal', 'DESC'], ['createdAt', 'DESC']]
        });
        res.status(200).json(history);
    } catch (error) {
        console.error(`Gagal mengambil riwayat hafalan untuk santri ${id_santri}:`, error);
        res.status(500).json({ message: "Gagal mengambil riwayat hafalan." });
    }
};

// Menambah data setoran hafalan baru ke tabel hafalan
const addHafalanProgress = async (req, res) => {
    const { id_santri, nama, keterangan, tanggal } = req.body;

    if (!id_santri || !nama || !keterangan || !tanggal) {
        return res.status(400).json({ message: "Semua kolom harus diisi." });
    }

    try {
        const newProgress = await Hafalan.create({
            id_santri,
            nama,
            keterangan,
            tanggal,
        });
        res.status(201).json({ message: "Data hafalan berhasil ditambahkan.", data: newProgress });
    } catch (error) {
        console.error("Gagal menambah data hafalan:", error);
        res.status(500).json({ message: "Gagal menyimpan data hafalan." });
    }
};

module.exports = {
    getHafalanProgressByWaliKamar,
    getHafalanHistory,
    addHafalanProgress,
};