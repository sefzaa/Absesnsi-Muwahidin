// file: controller/santri.js

const { Santri, Kelas, Kamar, Asrama, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- MODIFIKASI DIMULAI DI SINI ---

const getAll = async (req, res) => {
  try {
    // Ambil jenis kelamin dari user yang sudah di-decode oleh middleware
    const adminJenisKelamin = req.user.jenis_kelamin;

    // Buat kondisi filter (where clause)
    const whereCondition = {};

    // Jika admin punya role yang terikat jenis kelamin (Putra / Putri),
    // tambahkan filter ke query.
    if (adminJenisKelamin === 'Putra' || adminJenisKelamin === 'Putri') {
      whereCondition.jenis_kelamin = adminJenisKelamin;
    }
    // Jika tidak ada jenis_kelamin (misal, superadmin di masa depan),
    // whereCondition akan kosong dan mengambil semua data.

    const santri = await Santri.findAll({
      where: whereCondition, // Terapkan kondisi filter di sini
      include: [
        { 
          model: Kelas, 
          attributes: ['nama_kelas'] 
        },
        {
          model: Kamar,
          attributes: ['id_kamar', 'nomor_kamar'],
          include: {
            model: Asrama,
            attributes: ['id_asrama', 'nama_gedung'],
          },
        },
      ],
      order: [['nama', 'ASC']],
    });

    res.status(200).json(santri);
  } catch (error) {
    console.error("Error fetching santri data:", error);
    res.status(500).json({ message: 'Gagal mengambil data santri', error: error.message });
  }
};

// --- MODIFIKASI SELESAI ---


const update = async (req, res) => {
  const { id } = req.params;
  const { nama, id_kelas, status_aktif, id_kamar } = req.body;
  
  try {
    let id_asrama = null;

    if (id_kamar) {
        const kamar = await Kamar.findByPk(id_kamar, { attributes: ['id_asrama'] });
        if (kamar) {
            id_asrama = kamar.id_asrama;
        }
    }

    await Santri.update({
      nama,
      id_kelas: id_kelas || null,
      status_aktif: status_aktif === 'Aktif',
      id_kamar: id_kamar || null,
      id_asrama: id_asrama,
    }, {
      where: { id_santri: id },
    });

    res.status(200).json({ message: 'Data santri berhasil diperbarui.' });

  } catch (error) {
    console.error(`Error updating santri with id ${id}:`, error);
    res.status(500).json({ message: 'Gagal memperbarui data santri', error: error.message });
  }
};

const getAllKelas = async (req, res) => {
    try {
        const kelas = await Kelas.findAll({ order: [['nama_kelas', 'ASC']] });
        res.status(200).json(kelas);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data kelas' });
    }
}

module.exports = {
  getAll,
  update,
  getAllKelas,
};