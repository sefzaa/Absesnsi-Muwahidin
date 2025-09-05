const { JamPelajaran } = require('../models');

// Membuat jam pelajaran baru
exports.createJamPelajaran = async (req, res) => {
    try {
        const { nama_jam, jam_mulai, jam_selesai } = req.body;

        // Validasi dasar
        if (!nama_jam || !jam_mulai || !jam_selesai) {
            return res.status(400).json({ message: 'Semua field harus diisi.' });
        }

        const jamPelajaran = await JamPelajaran.create({ nama_jam, jam_mulai, jam_selesai });
        res.status(201).json({ message: 'Jam pelajaran berhasil ditambahkan.', data: jamPelajaran });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Nama jam pelajaran sudah ada.' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
    }
};

// Mendapatkan semua jam pelajaran, diurutkan berdasarkan jam mulai
exports.getAllJamPelajaran = async (req, res) => {
    try {
        const jamPelajaranList = await JamPelajaran.findAll({
            order: [['jam_mulai', 'ASC']]
        });
        res.status(200).json(jamPelajaranList);
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
    }
};

// Mengupdate jam pelajaran
exports.updateJamPelajaran = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_jam, jam_mulai, jam_selesai } = req.body;

        const jamPelajaran = await JamPelajaran.findByPk(id);
        if (!jamPelajaran) {
            return res.status(404).json({ message: 'Jam pelajaran tidak ditemukan.' });
        }

        await jamPelajaran.update({ nama_jam, jam_mulai, jam_selesai });
        res.status(200).json({ message: 'Jam pelajaran berhasil diperbarui.', data: jamPelajaran });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Nama jam pelajaran sudah ada.' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
    }
};

// Menghapus jam pelajaran
exports.deleteJamPelajaran = async (req, res) => {
    try {
        const { id } = req.params;
        const jamPelajaran = await JamPelajaran.findByPk(id);
        if (!jamPelajaran) {
            return res.status(404).json({ message: 'Jam pelajaran tidak ditemukan.' });
        }

        await jamPelajaran.destroy();
        res.status(200).json({ message: 'Jam pelajaran berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.', error: error.message });
    }
};