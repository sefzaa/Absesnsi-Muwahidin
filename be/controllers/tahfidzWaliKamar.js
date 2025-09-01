// file: controllers/tahfidzWaliKamar.js
const { Santri, Surah, Tahfidz, Kamar, sequelize } = require('../models');
const { Op } = require('sequelize');

// REVISI TOTAL: Mendapatkan daftar santri asuhan wali kamar, dikelompokkan per kamar
const getAllSantriProgress = async (req, res) => {
    try {
        const { id_wali_kamar } = req.user; // Ambil id dari token
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
                {
                    model: Tahfidz,
                    include: [{ model: Surah, attributes: ['nama'] }],
                    order: [['tanggal', 'DESC'], ['createdAt', 'DESC']],
                    limit: 1,
                    required: false
                }
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
            
            const lastSubmission = santri.Tahfidzs && santri.Tahfidzs[0];
            groupedByKamar[kamarId].santri.push({
                id_santri: santri.id_santri,
                nama: santri.nama,
                lastSurah: lastSubmission && lastSubmission.Surah ? lastSubmission.Surah.nama : '-',
                lastAyat: lastSubmission ? lastSubmission.ayat : '-'
            });
        });

        const formattedData = Object.values(groupedByKamar);
        res.status(200).json(formattedData);

    } catch (error) {
        console.error("Gagal mengambil progres tahfidz:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Melihat riwayat setoran seorang santri
const getHistoryBySantri = async (req, res) => {
    try {
        const history = await Tahfidz.findAll({
            where: { id_santri: req.params.id_santri },
            include: [{ model: Surah, attributes: ['nama'] }],
            order: [['tanggal', 'DESC'], ['createdAt', 'DESC']]
        });
        res.status(200).json(history);
    } catch (error) {
        console.error("Gagal mengambil riwayat tahfidz:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Menambah setoran baru
const createSetoran = async (req, res) => {
    const { id_santri, id_surah, ayat, tanggal } = req.body;
    try {
        const newRecord = await Tahfidz.create({ id_santri, id_surah, ayat, tanggal });
        res.status(201).json(newRecord);
    } catch (error) {
        console.error("Gagal menambah setoran:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Helper untuk mendapatkan list surah
const getSurahOptions = async (req, res) => {
    try {
        const surahs = await Surah.findAll({ order: [['id_surah', 'ASC']] });
        res.status(200).json(surahs);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data surah" });
    }
};

module.exports = {
    getAllSantriProgress,
    getHistoryBySantri,
    createSetoran,
    getSurahOptions
};