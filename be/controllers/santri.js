// file: controllers/santri.js

const { Santri, Kelas, Ortu, sequelize } = require('../models');
const { Op } = require('sequelize');

// --- GET ALL SANTRI (dengan filter jenis kelamin dan include data ortu) ---
const getAll = async (req, res) => {
  try {
    const adminJenisKelamin = req.user.jenis_kelamin;
    const whereCondition = {};

    if (adminJenisKelamin === 'Putra' || adminJenisKelamin === 'Putri') {
      whereCondition.jenis_kelamin = adminJenisKelamin;
    }

    const santri = await Santri.findAll({
      where: whereCondition,
      include: [
        { 
          model: Kelas, 
          attributes: ['id_kelas', 'nama_kelas'] 
        },
        {
          model: Ortu, // Selalu sertakan data orang tua
          required: false // Gunakan LEFT JOIN
        }
      ],
      order: [['nama', 'ASC']],
    });

    res.status(200).json(santri);
  } catch (error) {
    console.error("Error fetching santri data:", error);
    res.status(500).json({ message: 'Gagal mengambil data santri', error: error.message });
  }
};

// --- GET ONE SANTRI BY ID (untuk modal view/edit) ---
const getById = async (req, res) => {
    const { id } = req.params;
    try {
        const santri = await Santri.findByPk(id, {
            include: [
                { model: Kelas, attributes: ['id_kelas', 'nama_kelas'] },
                { model: Ortu, required: false } // 'required: false' melakukan LEFT JOIN
            ]
        });

        if (!santri) {
            return res.status(404).json({ message: 'Santri tidak ditemukan' });
        }
        res.status(200).json(santri);
    } catch (error) {
        console.error(`Error fetching santri with id ${id}:`, error);
        res.status(500).json({ message: 'Gagal mengambil detail santri', error: error.message });
    }
};

// --- CREATE NEW SANTRI (dengan data ortu) ---
const create = async (req, res) => {
    const { Ortu: ortuData, ...santriData } = req.body;
    const transaction = await sequelize.transaction();

    try {
        // 1. Buat data Ortu terlebih dahulu
        const newOrtu = await Ortu.create(ortuData, { transaction });

        // 2. Buat data Santri dengan id_ortu dari data yang baru dibuat
        await Santri.create({
            ...santriData,
            id_ortu: newOrtu.id_ortu
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Data santri dan orang tua berhasil ditambahkan.' });

    } catch (error) {
        await transaction.rollback();
        console.error("Error creating santri:", error);
        // Memberikan pesan error yang lebih spesifik jika ada validation error
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Data tidak valid', errors: messages });
        }
        res.status(500).json({ message: 'Gagal menambah data santri', error: error.message });
    }
};

// --- UPDATE SANTRI (dengan data ortu) ---
const update = async (req, res) => {
  const { id } = req.params;
  const { Ortu: ortuData, ...santriData } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const santri = await Santri.findByPk(id);
    if (!santri) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    // 1. Update data Santri
    // Hapus id_ortu dari santriData agar tidak terupdate langsung
    delete santriData.id_ortu;
    await santri.update(santriData, { transaction });

    // 2. Update atau Buat data Ortu
    if (santri.id_ortu && ortuData) {
        // Jika santri sudah punya ortu, update datanya
        await Ortu.update(ortuData, {
            where: { id_ortu: santri.id_ortu },
            transaction
        });
    } else if (ortuData) {
        // Jika santri belum punya ortu, buat baru dan hubungkan
        const newOrtu = await Ortu.create(ortuData, { transaction });
        await santri.update({ id_ortu: newOrtu.id_ortu }, { transaction });
    }
    
    await transaction.commit();
    res.status(200).json({ message: 'Data santri dan orang tua berhasil diperbarui.' });

  } catch (error) {
    await transaction.rollback();
    console.error(`Error updating santri with id ${id}:`, error);
    res.status(500).json({ message: 'Gagal memperbarui data santri', error: error.message });
  }
};

// --- PROMOTE ALL SANTRI (Fitur Naik Kelas) ---
const promoteAll = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // 1. Ambil jenis kelamin admin dari data user yang login
        const adminJenisKelamin = req.user.jenis_kelamin;
        const whereCondition = {};

        // 2. Buat kondisi filter jika admin adalah admin Putra atau Putri
        if (adminJenisKelamin === 'Putra' || adminJenisKelamin === 'Putri') {
            whereCondition.jenis_kelamin = adminJenisKelamin;
        }
        
        // 3. Jadikan santri kelas 6 menjadi Alumni (kelas 7), SESUAI GENDER ADMIN
        const [graduatedCount] = await Santri.update(
            { id_kelas: 7 },
            { 
                where: {
                    ...whereCondition, // Terapkan filter gender
                    id_kelas: 6 
                },
                transaction 
            }
        );

        // 4. Naikkan kelas 1 tingkat untuk santri di kelas 1 s/d 5, SESUAI GENDER ADMIN
        const [promotedResult] = await Santri.update(
            { id_kelas: sequelize.literal('id_kelas + 1') },
            {
                where: {
                    ...whereCondition, // Terapkan filter gender
                    id_kelas: { [Op.between]: [1, 5] } 
                },
                transaction
            }
        );
        const promotedCount = Array.isArray(promotedResult) ? promotedResult.length : promotedResult;


        if (promotedCount === 0 && graduatedCount === 0) {
            await transaction.commit();
            return res.status(200).json({ message: 'Tidak ada santri yang perlu diproses untuk asrama ini.' });
        }
        
        await transaction.commit();
        res.status(200).json({ 
            message: `Proses selesai. ${promotedCount} santri berhasil naik kelas dan ${graduatedCount} santri telah menjadi alumni.` 
        });

    } catch (error) {
        await transaction.rollback();
        console.error("Error promoting santri:", error);
        res.status(500).json({ message: 'Gagal memproses kenaikan kelas', error: error.message });
    }
};

// --- GET ALL KELAS (untuk dropdown) ---
const getAllKelas = async (req, res) => {
    try {
        const kelas = await Kelas.findAll({ order: [['id_kelas', 'ASC']] });
        res.status(200).json(kelas);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data kelas' });
    }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  promoteAll,
  getAllKelas,
};
