// controllers/pelanggaranAsrama.js

const { PelanggaranAsrama } = require('../models');

// Mendapatkan semua jenis pelanggaran sesuai kategori admin
const getAll = async (req, res) => {
  try {
    const adminJenisKelamin = req.user.jenis_kelamin;
    const kategoriFilter = adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri';

    const items = await PelanggaranAsrama.findAll({
      where: { kategori: kategoriFilter },
      order: [['bobot', 'ASC']]
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pelanggaran', error: error.message });
  }
};

// Membuat jenis pelanggaran baru sesuai kategori admin
const create = async (req, res) => {
  const { nama, jenis, bobot } = req.body;
  if (!nama || !jenis || bobot === undefined) {
    return res.status(400).json({ message: 'Nama, jenis, dan bobot harus diisi.' });
  }

  try {
    const adminJenisKelamin = req.user.jenis_kelamin;
    const kategori = adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri';

    const newItem = await PelanggaranAsrama.create({ nama, jenis, bobot, kategori });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat data pelanggaran', error: error.message });
  }
};

// Memperbarui jenis pelanggaran (hanya yang sesuai kategori)
const update = async (req, res) => {
  const { id_pelanggaran } = req.params;
  const { nama, jenis, bobot } = req.body;
  
  const adminJenisKelamin = req.user.jenis_kelamin;
  const kategoriFilter = adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri';

  try {
    const item = await PelanggaranAsrama.findOne({
      where: { id_pelanggaran, kategori: kategoriFilter }
    });

    if (!item) {
      return res.status(404).json({ message: 'Jenis pelanggaran tidak ditemukan atau Anda tidak punya akses.' });
    }

    item.nama = nama;
    item.jenis = jenis;
    item.bobot = bobot;
    await item.save();

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui data pelanggaran', error: error.message });
  }
};

// Menghapus jenis pelanggaran (hanya yang sesuai kategori)
const destroy = async (req, res) => {
  const { id_pelanggaran } = req.params;
  const adminJenisKelamin = req.user.jenis_kelamin;
  const kategoriFilter = adminJenisKelamin === 'Putra' ? 'Putra' : 'Putri';
  
  try {
    const num = await PelanggaranAsrama.destroy({
      where: { id_pelanggaran, kategori: kategoriFilter }
    });

    if (num == 1) {
        res.status(200).json({ message: 'Jenis pelanggaran berhasil dihapus.' });
    } else {
        res.status(404).json({ message: 'Gagal menghapus. Jenis pelanggaran tidak ditemukan atau Anda tidak punya akses.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus data pelanggaran', error: error.message });
  }
};

module.exports = {
  getAll,
  create,
  update,
  destroy,
};