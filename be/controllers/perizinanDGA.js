// file: controllers/perizinanDGA.js
const { DetailIzinAsrama, Santri, Kelas, Kamar, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Mendapatkan semua data izin harian dengan data kamar
const getIzinHarian = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        const userGender = req.user.jenis_kelamin_disgiat;

        if (!userGender) {
            return res.status(403).json({ message: 'Role tidak memiliki akses jenis kelamin spesifik.' });
        }

        const santriWhereClause = { jenis_kelamin: userGender };
        if (search) {
            santriWhereClause.nama = { [Op.like]: `%${search}%` };
        }
        
        let dateWhereClause = {};
        if (startDate && endDate) {
            dateWhereClause.tanggal_awal = { [Op.between]: [startDate, endDate] };
        }

        const izinHarian = await DetailIzinAsrama.findAll({
            where: { 
                id_izin_asrama: 2,
                ...dateWhereClause
            },
            include: [
                {
                    model: Santri,
                    attributes: ['id_santri', 'nama'],
                    where: santriWhereClause,
                    required: true,
                    include: [
                        { model: Kelas, as: 'Kela', attributes: ['nama_kelas'] },
                        { model: Kamar, as: 'Kamar', attributes: ['nomor_kamar'] }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json(izinHarian);
    } catch (error) {
        console.error("Error fetching izin harian:", error);
        res.status(500).json({ message: 'Gagal mengambil data perizinan', error: error.message });
    }
};


// Mendapatkan daftar santri (FILTERED)
const getAllSantri = async (req, res) => {
    try {
        const userGender = req.user.jenis_kelamin_disgiat;

        // --- ▼▼▼ PERBAIKAN: Tambahkan pengecekan ini ▼▼▼ ---
        if (!userGender) {
            return res.status(403).json({ message: 'Role tidak memiliki akses jenis kelamin spesifik.' });
        }
        // --- ▲▲▲ AKHIR PERBAIKAN ---

        const santri = await Santri.findAll({
            where: { 
                status_aktif: true,
                jenis_kelamin: userGender
            },
            attributes: ['id_santri', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(santri);
    } catch (error) {
        console.error("Error fetching santri list:", error);
        res.status(500).json({ message: 'Gagal mengambil data santri', error: error.message });
    }
};

// --- FUNGSI UNTUK IZIN MINGGUAN (DIPERBARUI) ---
const getIzinMingguan = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        const userGender = req.user.jenis_kelamin_disgiat;

        if (!userGender) {
            return res.status(403).json({ message: 'Role tidak memiliki akses jenis kelamin spesifik.' });
        }

        const santriWhereClause = { jenis_kelamin: userGender };
        if (search) {
            santriWhereClause.nama = { [Op.like]: `%${search}%` };
        }
        
        let dateWhereClause = {};
        if (startDate && endDate) {
            dateWhereClause.tanggal_awal = { [Op.between]: [startDate, endDate] };
        }

        const izinMingguan = await DetailIzinAsrama.findAll({
            where: { 
                id_izin_asrama: 3,
                ...dateWhereClause
            },
            include: [
                {
                    model: Santri,
                    attributes: ['id_santri', 'nama'],
                    where: santriWhereClause,
                    required: true,
                    include: [
                        { model: Kelas, as: 'Kela', attributes: ['nama_kelas'], required: false },
                        { model: Kamar, as: 'Kamar', attributes: ['nomor_kamar'], required: false }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json(izinMingguan);
    } catch (error) {
        console.error("Error fetching izin mingguan:", error);
        res.status(500).json({ message: 'Gagal mengambil data perizinan mingguan', error: error.message });
    }
};


const getIzinPulang = async (req, res) => {
    try {
        const { search, startDate, endDate } = req.query;
        const userGender = req.user.jenis_kelamin_disgiat;

        if (!userGender) {
            return res.status(403).json({ message: 'Role tidak memiliki akses jenis kelamin spesifik.' });
        }

        const santriWhereClause = { jenis_kelamin: userGender };
        if (search) {
            santriWhereClause.nama = { [Op.like]: `%${search}%` };
        }
        
        let dateWhereClause = {};
        if (startDate && endDate) {
            dateWhereClause.tanggal_awal = { [Op.between]: [startDate, endDate] };
        }

        const izinPulang = await DetailIzinAsrama.findAll({
            where: { 
                id_izin_asrama: 1, // ID 1 untuk 'pulang'
                ...dateWhereClause
            },
            include: [
                {
                    model: Santri,
                    attributes: ['id_santri', 'nama'],
                    where: santriWhereClause,
                    required: true,
                    include: [
                        { model: Kelas, as: 'Kela', attributes: ['nama_kelas'], required: false },
                        { model: Kamar, as: 'Kamar', attributes: ['nomor_kamar'], required: false }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
        });
        res.status(200).json(izinPulang);
    } catch (error) {
        console.error("Error fetching izin pulang:", error);
        res.status(500).json({ message: 'Gagal mengambil data perizinan pulang', error: error.message });
    }
};


// Fungsi CREATE yang disatukan
const createPerizinan = async (req, res) => {
    const { id_santri, id_izin_asrama, tanggal_awal, tanggal_akhir, jam_keluar, jam_masuk, keterangan, pamong, pamong_lainnya, nama_pamong } = req.body;
    try {
        if (!id_santri || !id_izin_asrama || !tanggal_awal || !jam_keluar || !jam_masuk) {
            return res.status(400).json({ message: 'Data wajib tidak boleh kosong.' });
        }
        const pamongToSave = pamong === 'Lainnya' ? pamong_lainnya : pamong;
        const namaPamongToSave = ['Kerabat', 'Lainnya', 'Orang Tua'].includes(pamong) ? nama_pamong : null;
        const final_tanggal_akhir = id_izin_asrama === 2 ? tanggal_awal : tanggal_akhir;
        const startDateTime = moment(`${tanggal_awal} ${jam_keluar}`).toDate();
        const endDateTime = moment(`${final_tanggal_akhir} ${jam_masuk}`).toDate();
        const newData = await DetailIzinAsrama.create({
            id_santri, id_izin_asrama, tanggal_awal: startDateTime, tanggal_akhir: endDateTime, jam_keluar, jam_masuk, keterangan, pamong: pamongToSave, nama_pamong: namaPamongToSave, status: 'Disetujui Disgiat', isApprove_wk: false,
        });
        res.status(201).json({ message: 'Izin berhasil ditambahkan.', data: newData });
    } catch (error) {
        console.error("Error creating perizinan:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- ▼▼▼ PERBAIKAN PADA FUNGSI UPDATE ▼▼▼ ---
const updatePerizinan = async (req, res) => {
    const { id } = req.params;
    const { tanggal_awal, tanggal_akhir, jam_keluar, jam_masuk, keterangan, pamong, pamong_lainnya, nama_pamong, status } = req.body;
    try {
        const record = await DetailIzinAsrama.findByPk(id);
        if (!record) return res.status(404).json({ message: "Data tidak ditemukan" });

        const pamongToSave = pamong === 'Lainnya' ? pamong_lainnya : pamong;
        const namaPamongToSave = ['Kerabat', 'Lainnya', 'Orang Tua'].includes(pamong) ? nama_pamong : null;
        
        // PERBAIKAN: Jika ini izin harian (id 2), `tanggal_akhir` harus sama dengan `tanggal_awal`.
        // Jika tidak, gunakan `tanggal_akhir` dari form.
        const final_tanggal_akhir = record.id_izin_asrama === 2 ? tanggal_awal : tanggal_akhir;

        const startDateTime = moment(`${tanggal_awal} ${jam_keluar}`).toDate();
        const endDateTime = moment(`${final_tanggal_akhir} ${jam_masuk}`).toDate();

        // Cek apakah tanggal valid sebelum update
        if (!moment(startDateTime).isValid() || !moment(endDateTime).isValid()) {
            return res.status(400).json({ message: "Format tanggal atau waktu tidak valid." });
        }

        await record.update({
            tanggal_awal: startDateTime,
            tanggal_akhir: endDateTime,
            jam_keluar,
            jam_masuk,
            keterangan,
            pamong: pamongToSave,
            nama_pamong: namaPamongToSave,
            status
        });
        res.status(200).json({ message: "Data berhasil diperbarui" });
    } catch (error) {
        console.error("Error updating perizinan:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
// --- ▲▲▲ AKHIR PERBAIKAN ---

module.exports = {
    getIzinHarian, getIzinMingguan, getIzinPulang, getAllSantri,
    createPerizinan, updatePerizinan,
};
