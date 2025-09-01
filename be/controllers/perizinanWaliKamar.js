const { Santri, IzinAsrama, DetailIzinAsrama, Kelas, Kamar } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// --- MODIFIKASI: Mengambil data perizinan HANYA untuk santri yang diasuh ---
const getAllPerizinan = async (req, res) => {
    try {
        const { sortKey, sortOrder, search, startDate, endDate } = req.query;
        const { id_wali_kamar } = req.user; // Ambil id_wali_kamar dari token JWT

        if (!id_wali_kamar) {
            return res.status(403).json({ message: "Akses ditolak. Bukan Wali Kamar." });
        }

        const santriWhereClause = search ? { nama: { [Op.like]: `%${search}%` } } : {};
        
        let dateWhereClause = {};
        if (startDate && endDate) {
            dateWhereClause.tanggal_awal = {
                [Op.between]: [startDate, endDate]
            };
        }

        let orderClause = [['tanggal_awal', 'DESC']];
        if (sortKey === 'name') {
            orderClause = [[Santri, 'nama', sortOrder || 'ASC']];
        }

        const records = await DetailIzinAsrama.findAll({
            where: { ...dateWhereClause },
            include: [
                { 
                    model: Santri, 
                    attributes: ['id_santri', 'nama'],
                    where: santriWhereClause,
                    required: true,
                    include: [
                        { model: Kelas, attributes: ['nama_kelas'], required: false },
                        { 
                            model: Kamar, 
                            attributes: ['nomor_kamar'], 
                            required: true, // Pastikan hanya santri yang punya kamar
                            where: { id_wali_kamar: id_wali_kamar } // Filter utama berdasarkan wali kamar
                        }
                    ]
                },
                { 
                    model: IzinAsrama, 
                    attributes: ['id_izin_asrama', 'jenis']
                }
            ],
            order: orderClause,
        });

        res.status(200).json(records);
    } catch (error) {
        console.error("Error fetching perizinan:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Fungsi untuk membuat izin baru (tidak ada perubahan logika, karena otorisasi di level rute)
const createPerizinan = async (req, res) => {
    const { id_santri, id_izin_asrama, tanggal_awal, tanggal_akhir, keterangan, jam_keluar, jam_masuk } = req.body;
    try {
        // TODO: Tambahan validasi, pastikan id_santri yang ditambahkan adalah santri asuhan wali kamar ini.
        // Untuk saat ini, kita percaya pada data dari frontend yang sudah difilter.
        const newData = await DetailIzinAsrama.create({
            id_santri, id_izin_asrama, tanggal_awal, tanggal_akhir, keterangan, jam_keluar, jam_masuk,
            status: 'Disetujui WK',
            isApprove_wk: true,
        });
        res.status(201).json(newData);
    } catch (error) {
        console.error("Error creating perizinan:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Fungsi untuk update izin (tidak ada perubahan logika)
const updatePerizinan = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_izin_asrama, tanggal_awal, tanggal_akhir, keterangan, jam_keluar, jam_masuk } = req.body;
        const record = await DetailIzinAsrama.findByPk(id);
        if (!record) return res.status(404).json({ message: "Data tidak ditemukan" });

        await record.update({ id_izin_asrama, tanggal_awal, tanggal_akhir, keterangan, jam_keluar, jam_masuk });
        res.status(200).json({ message: "Data berhasil diperbarui" });
    } catch (error) {
        console.error("Error updating perizinan:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Fungsi untuk laporan pulang (tidak ada perubahan logika)
const laporanPulang = async (req, res) => {
    try {
        const { id } = req.params;
        const { jam_kembali_aktual } = req.body;
        const record = await DetailIzinAsrama.findByPk(id);
        if (!record) return res.status(404).json({ message: "Data tidak ditemukan" });

        const waktuSeharusnyaKembali = moment(`${moment(record.tanggal_akhir).format('YYYY-MM-DD')} ${record.jam_masuk}`);
        const waktuAktualKembali = moment(`${moment().format('YYYY-MM-DD')} ${jam_kembali_aktual}`);

        const isTerlambat = waktuAktualKembali.isAfter(waktuSeharusnyaKembali);

        await record.update({
            jam_kembali_aktual: jam_kembali_aktual,
            status: isTerlambat ? 'Terlambat' : 'Selesai'
        });
        res.status(200).json({ message: "Laporan pulang berhasil disimpan" });
    } catch (error) {
        console.error("Error laporan pulang:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


// --- MODIFIKASI: Mengambil data santri HANYA yang diasuh oleh wali kamar ---
const getSantriOptions = async (req, res) => {
    try {
        const { id_wali_kamar } = req.user; // Ambil id_wali_kamar dari token
        if (!id_wali_kamar) {
            return res.status(403).json({ message: "Akses ditolak." });
        }

        const santri = await Santri.findAll({
            attributes: ['id_santri', 'nama'],
            include: [{
                model: Kamar,
                attributes: [], // Tidak perlu menampilkan atribut kamar di sini
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

const getJenisIzinOptions = async (req, res) => {
    try {
        const jenis = await IzinAsrama.findAll();
        res.status(200).json(jenis);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil jenis izin" });
    }
};

module.exports = {
    getAllPerizinan,
    createPerizinan,
    updatePerizinan,
    laporanPulang,
    getSantriOptions,
    getJenisIzinOptions,
};
