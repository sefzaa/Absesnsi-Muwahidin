const { AbsenPegawai, Pegawai, Jabatan, User } = require('../models');
const { Op } = require('sequelize');

// =================================================================
// ABSENSI CONTROLLERS
// =================================================================

// Membuat data absensi baru
exports.createAbsensi = async (req, res) => {
    try {
        if (!req.user || !req.user.id_user) {
            return res.status(403).json({ message: "Akses ditolak. Sesi Anda tidak valid atau telah berakhir." });
        }

        // --- PERUBAHAN: Ambil 'status_jam_masuk' dari request body ---
        const { id_pegawai, tanggal, status, jam_masuk, jam_keluar, status_jam_masuk, keterangan } = req.body;
        const diinput_oleh = req.user.id_user;

        const existingAbsensi = await AbsenPegawai.findOne({
            where: { id_pegawai, tanggal }
        });

        if (existingAbsensi) {
            return res.status(409).json({ message: 'Absensi untuk pegawai ini pada tanggal tersebut sudah ada.' });
        }

        // --- PERBAIKAN: Hapus logika otomatis ini ---
        // let status_jam_masuk = 'On Time'; 
        // if (jam_masuk && jam_masuk > '08:00:00') {
        //     status_jam_masuk = 'Terlambat';
        // }
        // Logika di atas sudah tidak diperlukan lagi.

        const newAbsensi = await AbsenPegawai.create({
            id_pegawai,
            diinput_oleh,
            tanggal,
            status,
            jam_masuk: status === 'Hadir' ? jam_masuk : null,
            jam_keluar: status === 'Hadir' ? jam_keluar : null,
            // Gunakan 'status_jam_masuk' yang dikirim dari frontend
            status_jam_masuk: status === 'Hadir' ? status_jam_masuk : null,
            keterangan,
        });

        res.status(201).json({ message: 'Absensi berhasil ditambahkan', data: newAbsensi });
    } catch (error) {
        console.error('Error creating absensi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};


// Mendapatkan semua data absensi dengan filter dan sorting
exports.getAllAbsensi = async (req, res) => {
    try {
        const { tanggal, id_jabatan, sortKey, sortOrder } = req.query;

        let whereClause = {};
        if (tanggal) {
            whereClause.tanggal = tanggal;
        }

        let includeOptions = [{
            model: Pegawai,
            as: 'Pegawai', // <--- KEMBALIKAN KE HURUF KAPITAL
            attributes: ['id_pegawai', 'nama'],
            include: [{
                model: Jabatan,
                as: 'Jabatan', // <--- Ubah ini juga menjadi Kapital untuk konsistensi (kemungkinan besar ini juga benar)
                attributes: ['nama_jabatan'],
            }]
        }];

        if (id_jabatan) {
            includeOptions[0].where = { id_jabatan: id_jabatan };
        }

     let orderClause = [];
        if (sortKey && sortOrder) {
            if (sortKey === 'nama') {
                orderClause.push([{ model: Pegawai, as: 'Pegawai' }, 'nama', sortOrder]);
            
            // --- TAMBAHKAN KONDISI INI ---
            } else if (sortKey === 'nama_jabatan') {
                orderClause.push([
                    { model: Pegawai, as: 'Pegawai' },
                    { model: Jabatan, as: 'Jabatan' },
                    'nama_jabatan',
                    sortOrder
                ]);
            // -----------------------------

            } else {
                orderClause.push([sortKey, sortOrder]);
            }
        } else {            orderClause.push(['tanggal', 'DESC'], ['createdAt', 'DESC']);
        }

        const absensi = await AbsenPegawai.findAll({
            where: whereClause,
            include: includeOptions,
            order: orderClause,
        });

        res.status(200).json(absensi);
    } catch (error) {
        console.error('Error getting all absensi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// Mengupdate data absensi
exports.updateAbsensi = async (req, res) => {
    try {
        const { id_absensi } = req.params;
        
        // --- PERUBAHAN: Ambil 'status_jam_masuk' dari request body ---
        const { id_pegawai, tanggal, status, jam_masuk, jam_keluar, status_jam_masuk, keterangan } = req.body;

        const absensi = await AbsenPegawai.findByPk(id_absensi);
        if (!absensi) {
            return res.status(404).json({ message: 'Data absensi tidak ditemukan' });
        }

        // (Logika pengecekan duplikat tetap sama)
        if (absensi.id_pegawai !== id_pegawai || absensi.tanggal !== tanggal) {
             const existingAbsensi = await AbsenPegawai.findOne({
                 where: {
                     id_pegawai,
                     tanggal,
                     id_absensi: { [Op.ne]: id_absensi }
                 }
             });
             if (existingAbsensi) {
                 return res.status(409).json({ message: 'Absensi untuk pegawai ini pada tanggal tersebut sudah ada.' });
             }
        }

        // --- PERBAIKAN: Hapus logika otomatis ---
        // Logika penentuan 'On Time'/'Terlambat' otomatis dihapus

        await absensi.update({
            id_pegawai,
            tanggal,
            status,
            jam_masuk: status === 'Hadir' ? jam_masuk : null,
            jam_keluar: status === 'Hadir' ? jam_keluar : null,
            // Gunakan 'status_jam_masuk' yang dikirim dari frontend
            status_jam_masuk: status === 'Hadir' ? status_jam_masuk : null,
            keterangan,
        });

        res.status(200).json({ message: 'Absensi berhasil diperbarui', data: absensi });
    } catch (error) {
        console.error('Error updating absensi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// Menghapus data absensi
exports.deleteAbsensi = async (req, res) => {
    try {
        const { id_absensi } = req.params;
        const absensi = await AbsenPegawai.findByPk(id_absensi);
        if (!absensi) {
            return res.status(404).json({ message: 'Data absensi tidak ditemukan' });
        }
        await absensi.destroy();
        res.status(200).json({ message: 'Absensi berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting absensi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// Mendapatkan riwayat absensi bulanan untuk satu pegawai
exports.getAbsensiHistory = async (req, res) => {
    try {
        const { id_pegawai } = req.params;
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ message: 'Parameter tahun dan bulan diperlukan.' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const pegawai = await Pegawai.findOne({
            where: { id_pegawai },
            attributes: ['nama']
        });

        if (!pegawai) {
            return res.status(404).json({ message: 'Data pegawai tidak ditemukan.' });
        }

        const history = await AbsenPegawai.findAll({
            where: {
                id_pegawai: id_pegawai,
                tanggal: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['tanggal', 'DESC']]
        });

        res.status(200).json({
            pegawai,
            history
        });
    } catch (error) {
        console.error('Error getting absensi history:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// =================================================================
// MASTER DATA CONTROLLERS (PEGAWAI & JABATAN)
// =================================================================

// Mendapatkan semua data pegawai (untuk dropdown form)
exports.getAllPegawai = async (req, res) => {
    try {
        const pegawaiList = await Pegawai.findAll({
            attributes: ['id_pegawai', 'nama'],
            order: [['nama', 'ASC']]
        });
        res.status(200).json(pegawaiList);
    } catch (error) {
        console.error('Error getting all pegawai:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

// Mendapatkan semua data jabatan (untuk filter)
exports.getAllJabatan = async (req, res) => {
    try {
        const jabatanList = await Jabatan.findAll({
            attributes: ['id_jabatan', 'nama_jabatan'],
            order: [['nama_jabatan', 'ASC']]
        });
        res.status(200).json(jabatanList);
    } catch (error) {
        console.error('Error getting all jabatan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
    }
};

