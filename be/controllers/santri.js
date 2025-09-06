// file: controllers/santri.js

const { Santri, Kelas, Ortu, User, Role, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');

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
          model: Ortu,
          required: false,
          include: [{
            model: User,
            attributes: ['username']
          }]
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

const getById = async (req, res) => {
    const { id } = req.params;
    try {
        const santri = await Santri.findByPk(id, {
            include: [
                { model: Kelas, attributes: ['id_kelas', 'nama_kelas'] },
                { 
                  model: Ortu, 
                  required: false,
                  include: [{
                    model: User,
                    attributes: ['username']
                  }]
                }
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

const create = async (req, res) => {
    const { Ortu: ortuData, ...santriData } = req.body;
    const { username, password, ...restOrtuData } = ortuData;
    const transaction = await sequelize.transaction();

    try {
        let ortuPayload = { ...restOrtuData };

        if (username && password) {
            const ortuRole = await Role.findOne({ where: { slug: 'orang-tua' } });
            if (!ortuRole) {
                await transaction.rollback();
                return res.status(500).json({ message: "Role 'orang-tua' tidak ditemukan di database. Silakan hubungi administrator." });
            }

            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                await transaction.rollback();
                return res.status(400).json({ message: 'Username sudah digunakan.' });
            }

            const hashedPassword = await bcrypt.hash(password, 8);

            const newUser = await User.create({
                nama: ortuData.nama_ortu_lk || `Wali dari ${santriData.nama}`,
                username: username,
                email: `${username}-${Date.now()}@pesantren.local`,
                password: hashedPassword,
                id_role: ortuRole.id_role,
                jenis_kelamin: null, 
            }, { transaction });

            ortuPayload.id_user = newUser.id_user;
        }

        const newOrtu = await Ortu.create(ortuPayload, { transaction });

        await Santri.create({
            ...santriData,
            id_ortu: newOrtu.id_ortu
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ message: 'Data santri dan orang tua berhasil ditambahkan.' });

    } catch (error) {
        await transaction.rollback();
        console.error("Error creating santri:", error);
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ message: 'Data tidak valid', errors: messages });
        }
        res.status(500).json({ message: 'Gagal menambah data santri', error: error.message });
    }
};

const update = async (req, res) => {
  const { id } = req.params;
  const { Ortu: ortuData, newPassword, newUsername, ...santriData } = req.body;
  const transaction = await sequelize.transaction();

  try {
    const santri = await Santri.findByPk(id, { include: [Ortu], transaction });
    if (!santri) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Santri tidak ditemukan' });
    }

    delete santriData.id_ortu;
    await santri.update(santriData, { transaction });

    if (santri.id_ortu && ortuData) {
        await Ortu.update(ortuData, {
            where: { id_ortu: santri.id_ortu },
            transaction
        });
    } else if (ortuData) {
        const newOrtu = await Ortu.create(ortuData, { transaction });
        await santri.update({ id_ortu: newOrtu.id_ortu }, { transaction });
    }
    
    // --- PERBAIKAN LOGIKA MANAJEMEN AKUN ---

    // Muat ulang data santri dan ortu setelah update untuk mendapatkan data terbaru
    const updatedSantri = await Santri.findByPk(id, { include: [Ortu], transaction });
    
    // Kasus 1: Buat user baru jika belum ada & form diisi
    if (updatedSantri.Ortu && !updatedSantri.Ortu.id_user && newUsername && newPassword) {
        const ortuRole = await Role.findOne({ where: { slug: 'orang-tua' }, transaction });
        if (!ortuRole) throw new Error("Role 'orang-tua' tidak ditemukan.");

        const existingUser = await User.findOne({ where: { username: newUsername }, transaction });
        if (existingUser) throw new Error('Username sudah digunakan.');

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        const newUser = await User.create({
            nama: updatedSantri.Ortu.nama_ortu_lk || `Wali dari ${updatedSantri.nama}`,
            username: newUsername,
            email: `${newUsername}-${Date.now()}@pesantren.local`,
            password: hashedPassword,
            id_role: ortuRole.id_role,
            jenis_kelamin: null,
        }, { transaction });
        
        await Ortu.update({ id_user: newUser.id_user }, { where: { id_ortu: updatedSantri.id_ortu }, transaction });
    } 
    // Kasus 2: Reset password untuk user yang sudah ada
    else if (updatedSantri.Ortu && updatedSantri.Ortu.id_user && newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 8);
        await User.update(
            { password: hashedPassword },
            { where: { id_user: updatedSantri.Ortu.id_user }, transaction }
        );
    }
    
    await transaction.commit();
    res.status(200).json({ message: 'Data santri dan orang tua berhasil diperbarui.' });

  } catch (error) {
    await transaction.rollback();
    console.error(`Error updating santri with id ${id}:`, error);
    res.status(500).json({ message: 'Gagal memperbarui data santri', error: error.message });
  }
};


const promoteAll = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const adminJenisKelamin = req.user.jenis_kelamin;
        const whereCondition = {};

        if (adminJenisKelamin === 'Putra' || adminJenisKelamin === 'Putri') {
            whereCondition.jenis_kelamin = adminJenisKelamin;
        }
        
        const [graduatedCount] = await Santri.update(
            { id_kelas: 7 },
            { where: { ...whereCondition, id_kelas: 6 }, transaction }
        );

        const [promotedResult] = await Santri.update(
            { id_kelas: sequelize.literal('id_kelas + 1') },
            { where: { ...whereCondition, id_kelas: { [Op.between]: [1, 5] } }, transaction }
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

