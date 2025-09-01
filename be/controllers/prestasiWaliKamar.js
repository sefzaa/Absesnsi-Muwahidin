// controllers/prestasiWaliKamar.js
const { Santri, Prestasi, Kamar, Kelas } = require('../models');
const { Op } = require('sequelize');

const getAllPrestasi = async (req, res) => {
    try {
        const { sortKey, sortOrder, search } = req.query;
        const { id_wali_kamar, jenis_kelamin_wk } = req.user;

        if (!id_wali_kamar) {
            return res.status(403).json({ message: "Akses ditolak. Bukan Wali Kamar." });
        }

        const santriWhereClause = { jenis_kelamin: jenis_kelamin_wk };
        if (search) {
            santriWhereClause.nama = { [Op.like]: `%${search}%` };
        }
        
        const orderClause = sortKey === 'name' 
            ? [[Santri, 'nama', sortOrder || 'ASC']] 
            : [['tanggal', sortOrder || 'DESC']];

        const allRecords = await Prestasi.findAll({
            include: [{
                model: Santri,
                attributes: ['id_santri', 'nama'],
                where: santriWhereClause,
                required: true,
                include: [
                    { model: Kamar, attributes: ['nomor_kamar', 'id_wali_kamar'], required: false },
                    { model: Kelas, attributes: ['nama_kelas'], required: false }
                ]
            }],
            order: orderClause
        });

        // Pisahkan data antara santri asuhan dan lainnya
        const santriAsuhan = allRecords.filter(rec => rec.Santri?.Kamar?.id_wali_kamar === id_wali_kamar);
        const santriLainnya = allRecords.filter(rec => rec.Santri?.Kamar?.id_wali_kamar !== id_wali_kamar);

        res.status(200).json({ santriAsuhan, santriLainnya });
    } catch (error) {
        console.error("Gagal mengambil data prestasi:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const createPrestasi = async (req, res) => {
    const { id_santri, prestasi, keterangan, tanggal } = req.body;
    try {
        const newRecord = await Prestasi.create({ id_santri, prestasi, keterangan, tanggal });
        res.status(201).json(newRecord);
    } catch (error) {
        console.error("Gagal membuat prestasi:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const updatePrestasi = async (req, res) => {
    try {
        const { id } = req.params;
        const { prestasi, keterangan, tanggal } = req.body;
        const record = await Prestasi.findByPk(id);
        if (!record) return res.status(404).json({ message: "Data tidak ditemukan" });

        await record.update({ prestasi, keterangan, tanggal });
        res.status(200).json({ message: "Data berhasil diperbarui" });
    } catch (error) {
        console.error("Gagal update prestasi:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const deletePrestasi = async (req, res) => {
    try {
        const { id } = req.params;
        const record = await Prestasi.findByPk(id);
        if (!record) return res.status(404).json({ message: "Data tidak ditemukan" });

        await record.destroy();
        res.status(200).json({ message: "Data berhasil dihapus" });
    } catch (error) {
        console.error("Gagal menghapus prestasi:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const getSantriOptions = async (req, res) => {
    try {
        const { id_wali_kamar } = req.user;
        if (!id_wali_kamar) {
            return res.status(403).json({ message: "Akses ditolak." });
        }

        const santri = await Santri.findAll({
            attributes: ['id_santri', 'nama'],
            include: [{
                model: Kamar,
                attributes: [],
                required: true,
                where: { id_wali_kamar: id_wali_kamar }
            }],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(santri);
    } catch (error) {
        console.error("Gagal mengambil data santri:", error);
        res.status(500).json({ message: "Gagal mengambil data santri" });
    }
};

module.exports = {
    getAllPrestasi,
    createPrestasi,
    updatePrestasi,
    deletePrestasi,
    getSantriOptions
};
