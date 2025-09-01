// file: controllers/pelanggaranWaliKamar.js
const { 
    Santri, 
    Kamar,
    Kelas,
    PelanggaranAsrama, 
    DetailPelanggaranAsrama,
} = require('../models');
const { Op } = require('sequelize');

const getPelanggaranRecords = async (req, res) => {
    try {
        const { id_wali_kamar, jenis_kelamin_wk } = req.user;
        if (!id_wali_kamar) {
            return res.status(403).json({ message: "Akses ditolak. Bukan Wali Kamar." });
        }

        const { search, jenis, startDate, endDate, sortKey, sortOrder, kelas } = req.query;
        
        const santriWhereClause = {};
        if (search) santriWhereClause.nama = { [Op.like]: `%${search}%` };
        if (kelas) santriWhereClause.id_kelas = kelas;

        const detailWhereClause = {};
        if (startDate && endDate) {
            detailWhereClause.tanggal = { [Op.between]: [new Date(startDate), new Date(endDate)] };
        }
        const pelanggaranWhereClause = jenis ? { id_pelanggaran: jenis } : {};

        const orderClause = [];
        if (sortKey === 'name') {
            orderClause.push([Santri, 'nama', sortOrder || 'ASC']);
        } else {
            orderClause.push(['tanggal', sortOrder || 'DESC']);
        }

        const allRecords = await DetailPelanggaranAsrama.findAll({
            where: detailWhereClause,
            include: [
                { 
                    model: Santri, 
                    attributes: ['id_santri', 'nama', 'id_kamar', 'jenis_kelamin'],
                    where: { ...santriWhereClause, jenis_kelamin: jenis_kelamin_wk },
                    required: true,
                    include: [
                        { model: Kamar, attributes: ['nomor_kamar', 'id_wali_kamar'] },
                        { model: Kelas, attributes: ['nama_kelas'] }
                    ]
                },
                { 
                    model: PelanggaranAsrama, 
                    // --- MODIFIKASI: Pastikan id_pelanggaran disertakan ---
                    attributes: ['id_pelanggaran', 'nama'],
                    where: pelanggaranWhereClause,
                    required: true
                }
            ],
            order: orderClause,
        });

        const santriAsuhan = allRecords.filter(rec => rec.Santri?.Kamar?.id_wali_kamar === id_wali_kamar);
        const santriLain = allRecords.filter(rec => rec.Santri?.Kamar?.id_wali_kamar !== id_wali_kamar);

        res.status(200).json({ santriAsuhan, santriLain });
    } catch (error) {
        console.error("Gagal mengambil catatan pelanggaran:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

const createPelanggaranRecord = async (req, res) => {
    const { id_santri, id_pelanggaran, pembinaan, keterangan } = req.body;
    const { nama } = req.user;

    if (!id_santri || !id_pelanggaran || !pembinaan) {
        return res.status(400).json({ message: "Santri, jenis pelanggaran, dan pembinaan harus diisi." });
    }
    try {
        await DetailPelanggaranAsrama.create({
            id_santri,
            id_pelanggaran,
            pembinaan,
            keterangan,
            created_by: nama,
            tanggal: new Date(),
        });
        res.status(201).json({ message: "Data pelanggaran berhasil ditambahkan." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menyimpan data." });
    }
};

const updatePelanggaranRecord = async (req, res) => {
    const { id } = req.params;
    const { id_pelanggaran, pembinaan, keterangan } = req.body;
    try {
        const record = await DetailPelanggaranAsrama.findByPk(id);
        if (!record) return res.status(404).json({ message: "Data tidak ditemukan." });
        
        await record.update({ id_pelanggaran, pembinaan, keterangan });
        res.status(200).json({ message: "Data berhasil diperbarui." });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui data." });
    }
};

const deletePelanggaranRecord = async (req, res) => {
    const { id } = req.params;
    try {
        const record = await DetailPelanggaranAsrama.findByPk(id);
        if (!record) return res.status(404).json({ message: "Data tidak ditemukan." });
        
        await record.destroy();
        res.status(200).json({ message: "Data berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus data." });
    }
};

const getKelasOptions = async (req, res) => {
    try {
        const kelas = await Kelas.findAll({ attributes: ['id_kelas', 'nama_kelas'], order: [['nama_kelas', 'ASC']] });
        res.status(200).json(kelas);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data kelas." });
    }
};

const getSantriByKelasOptions = async (req, res) => {
    try {
        const { id_kelas } = req.params;
        const { jenis_kelamin_wk } = req.user;
        if (!id_kelas) return res.status(400).json({ message: "ID Kelas diperlukan." });

        const santri = await Santri.findAll({
            where: { id_kelas, jenis_kelamin: jenis_kelamin_wk },
            attributes: ['id_santri', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(santri);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data santri." });
    }
};

const getJenisPelanggaranOptions = async (req, res) => {
    try {
        const { jenis_kelamin_wk } = req.user;
        const jenis = await PelanggaranAsrama.findAll({
            where: { kategori: jenis_kelamin_wk },
            attributes: ['id_pelanggaran', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(jenis);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data jenis pelanggaran." });
    }
};

module.exports = {
    getPelanggaranRecords,
    createPelanggaranRecord,
    updatePelanggaranRecord,
    deletePelanggaranRecord,
    getKelasOptions,
    getSantriByKelasOptions,
    getJenisPelanggaranOptions,
};
