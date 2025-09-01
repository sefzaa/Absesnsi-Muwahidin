// controllers/spp.js

// Impor model dari file index di dalam folder models
// Pastikan path-nya benar sesuai struktur proyek Anda
const { SppKomponen } = require('../models');

// Mendapatkan semua komponen SPP
const getAll = async (req, res) => {
  try {
    const sppItems = await SppKomponen.findAll({
      order: [['createdAt', 'ASC']] // Mengurutkan berdasarkan waktu pembuatan
    });
    res.status(200).json(sppItems);
  } catch (error) {
    console.error("Error saat mengambil data SPP:", error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// Menambahkan komponen SPP baru
const create = async (req, res) => {
  const { name, amount } = req.body;

  // Validasi input dasar
  if (!name || amount === undefined || amount === null) {
    return res.status(400).json({ message: 'Nama dan Jumlah harus diisi.' });
  }

  try {
    const newItem = await SppKomponen.create({
      name,
      amount: Number(amount)
    });
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error saat membuat item SPP:", error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// Memperbarui komponen SPP berdasarkan ID
const update = async (req, res) => {
  const { id } = req.params;
  const { name, amount } = req.body;

  try {
    const item = await SppKomponen.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: 'Item SPP tidak ditemukan.' });
    }

    // Update field jika ada di body request
    item.name = name || item.name;
    item.amount = amount !== undefined ? Number(amount) : item.amount;
    
    await item.save();

    res.status(200).json(item);
  } catch (error)
  {
    console.error(`Error saat memperbarui item SPP dengan id ${id}:`, error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// Menghapus komponen SPP berdasarkan ID
const destroy = async (req, res) => {
  const { id } = req.params;

  try {
    const item = await SppKomponen.findByPk(id);

    if (!item) {
      return res.status(404).json({ message: 'Item SPP tidak ditemukan.' });
    }

    await item.destroy();
    res.status(200).json({ message: 'Item SPP berhasil dihapus.' });
  } catch (error) {
    console.error(`Error saat menghapus item SPP dengan id ${id}:`, error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message });
  }
};

// Ekspor semua fungsi agar bisa digunakan di file routes
module.exports = {
  getAll,
  create,
  update,
  destroy,
};
