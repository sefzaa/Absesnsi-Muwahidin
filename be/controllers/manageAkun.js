// controllers/manageAkun.js
const { WaliKamar, Kamar, Asrama, DisgiatAsrama, User, Role, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

// Helper untuk mendapatkan ID Role
const getRoleId = async (roleName) => {
    const role = await Role.findOne({ where: { nama_role: roleName } });
    if (!role) throw new Error(`Role '${roleName}' tidak ditemukan.`);
    return role.id_role;
};

// ======================================================
// ===           FUNGSI UNTUK WALI KAMAR              ===
// ======================================================

const getAllWaliKamar = async (req, res) => {
    try {
        const adminJenisKelamin = req.user.jenis_kelamin;
        const waliKamarData = await WaliKamar.findAll({
            where: { jenis_kelamin: adminJenisKelamin },
            include: [{
                model: Kamar,
                attributes: ['nomor_kamar'],
                include: { model: Asrama, attributes: ['nama_gedung'] }
            }],
            order: [['nama', 'ASC']]
        });

        // DIPERBARUI: Menambahkan field baru ke data yang dikirim ke frontend
        const formattedData = waliKamarData.map(wali => ({
            id_wali_kamar: wali.id_wali_kamar,
            id_user: wali.id_user,
            name: wali.nama,
            kontak: wali.no_telp,
            tempat_lahir: wali.tempat_lahir,
            tanggal_lahir: wali.tanggal_lahir,
            alamat: wali.alamat,
            tahun_masuk: wali.tahun_masuk,
            kamar: wali.Kamars && wali.Kamars.length > 0 ? wali.Kamars.map(k => k.nomor_kamar).join(', ') : '-',
            asrama: wali.Kamars && wali.Kamars.length > 0 && wali.Kamars[0].Asrama ? wali.Kamars[0].Asrama.nama_gedung : '-',
            avatar: wali.avatar ? `${req.protocol}://${req.get('host')}/${wali.avatar.replace(/\\/g, "/")}` : `https://placehold.co/100x100/E2E8F0/4A5568?text=${wali.nama.charAt(0)}`
        }));
        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data Wali Kamar', error: error.message });
    }
};

const createWaliKamar = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // DIPERBARUI: Menangkap field baru dari req.body
        const { nama, no_telp, tempat_lahir, tanggal_lahir, alamat, tahun_masuk, password, username } = req.body;
        if (!nama || !password || !username) {
            return res.status(400).json({ message: 'Nama, Username, dan Password tidak boleh kosong.' });
        }

        const adminJenisKelamin = req.user.jenis_kelamin;
        const roleId = await getRoleId('Wali Kamar');

        const newUser = await User.create({
            nama,
            username,
            email: `${username}@pesantren.com`,
            password: bcrypt.hashSync(password, 8),
            jenis_kelamin: adminJenisKelamin,
            id_role: roleId
        }, { transaction: t });

        // DIPERBARUI: Menyimpan field baru ke database
        const newWaliKamar = await WaliKamar.create({
            nama,
            no_telp,
            tempat_lahir,
            tanggal_lahir: tanggal_lahir || null,
            alamat,
            tahun_masuk,
            jenis_kelamin: adminJenisKelamin,
            avatar: req.file ? req.file.path.replace(/\\/g, "/") : null,
            id_user: newUser.id_user
        }, { transaction: t });

        await t.commit();
        res.status(201).json(newWaliKamar);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Gagal membuat data Wali Kamar.', error: error.message });
    }
};

const updateWaliKamar = async (req, res) => {
    const { id } = req.params;
    // DIPERBARUI: Menangkap field baru dari req.body
    const { nama, no_telp, tempat_lahir, tanggal_lahir, alamat, tahun_masuk, password } = req.body;
    const t = await sequelize.transaction();
    try {
        const wali = await WaliKamar.findByPk(id, { transaction: t });
        if (!wali) return res.status(404).json({ message: 'Wali Kamar tidak ditemukan.' });

        const user = await User.findByPk(wali.id_user, { transaction: t });
        if (user) {
            user.nama = nama;
            if (password) user.password = bcrypt.hashSync(password, 8);
            await user.save({ transaction: t });
        }

        // DIPERBARUI: Memperbarui field baru
        wali.nama = nama;
        wali.no_telp = no_telp;
        wali.tempat_lahir = tempat_lahir;
        wali.tanggal_lahir = tanggal_lahir || null;
        wali.alamat = alamat;
        wali.tahun_masuk = tahun_masuk;
        if (req.file) wali.avatar = req.file.path.replace(/\\/g, "/");
        await wali.save({ transaction: t });

        await t.commit();
        res.status(200).json(wali);
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Gagal memperbarui data Wali Kamar', error: error.message });
    }
};

// ... (Fungsi destroyWaliKamar dan semua fungsi Disgiat Asrama tetap sama) ...
const destroyWaliKamar = async (req, res) => {
    const { id } = req.params;
    const t = await sequelize.transaction();
    try {
        const wali = await WaliKamar.findByPk(id, { transaction: t });
        if (!wali) return res.status(404).json({ message: 'Wali Kamar tidak ditemukan.' });

        if (wali.id_user) await User.destroy({ where: { id_user: wali.id_user }, transaction: t });
        
        await wali.destroy({ transaction: t });

        await t.commit();
        res.status(200).json({ message: 'Wali Kamar berhasil dihapus.' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Gagal menghapus data Wali Kamar', error: error.message });
    }
};

// ======================================================
// ===         FUNGSI UNTUK DISGIAT ASRAMA            ===
// ======================================================

const getAllDisgiatAsrama = async (req, res) => {
    try {
        const adminJenisKelamin = req.user.jenis_kelamin;
        const data = await DisgiatAsrama.findAll({ where: { jenis_kelamin: adminJenisKelamin }, order: [['nama', 'ASC']] });
        const formattedData = data.map(akun => ({
            id_disgiat_asrama: akun.id_disgiat_asrama, // PERBAIKAN
            id_user: akun.id_user,
            name: akun.nama,
            kontak: akun.no_telp,
            avatar: akun.avatar ? `${req.protocol}://${req.get('host')}/${akun.avatar.replace(/\\/g, "/")}` : `https://placehold.co/100x100/E2E8F0/4A5568?text=${akun.nama.charAt(0)}`
        }));
        res.status(200).json(formattedData);
    } catch (error) { res.status(500).json({ message: 'Gagal mengambil data Disgiat Asrama', error: error.message }); }
};

const createDisgiatAsrama = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { nama, no_telp, password, username } = req.body;
        if (!nama || !password || !username) return res.status(400).json({ message: 'Nama, Username, dan Password tidak boleh kosong.' });
        const adminJenisKelamin = req.user.jenis_kelamin;
        const roleId = await getRoleId('Disgiat Asrama');
        const newUser = await User.create({ nama, username, email: `${username}@pesantren.com`, password: bcrypt.hashSync(password, 8), jenis_kelamin: adminJenisKelamin, id_role: roleId }, { transaction: t });
        const newAkun = await DisgiatAsrama.create({ nama, jenis_kelamin: adminJenisKelamin, no_telp, avatar: req.file ? req.file.path.replace(/\\/g, "/") : null, id_user: newUser.id_user }, { transaction: t });
        await t.commit();
        res.status(201).json(newAkun);
    } catch (error) { await t.rollback(); res.status(500).json({ message: `Gagal membuat Disgiat Asrama: ${error.message}` }); }
};

const updateDisgiatAsrama = async (req, res) => {
    const { id_disgiat_asrama } = req.params; // PERBAIKAN
    const { nama, no_telp, password } = req.body;
    const t = await sequelize.transaction();
    try {
        const akun = await DisgiatAsrama.findByPk(id_disgiat_asrama, { transaction: t }); // PERBAIKAN
        if (!akun) return res.status(404).json({ message: 'Akun Disgiat Asrama tidak ditemukan.' });
        const user = await User.findByPk(akun.id_user, { transaction: t });
        if(user) { user.nama = nama; if(password) user.password = bcrypt.hashSync(password, 8); await user.save({ transaction: t }); }
        akun.nama = nama;
        akun.no_telp = no_telp;
        if (req.file) akun.avatar = req.file.path.replace(/\\/g, "/");
        await akun.save({ transaction: t });
        await t.commit();
        res.status(200).json(akun);
    } catch (error) { await t.rollback(); res.status(500).json({ message: 'Gagal memperbarui data Disgiat Asrama', error: error.message }); }
};

const destroyDisgiatAsrama = async (req, res) => {
    const { id_disgiat_asrama } = req.params; // PERBAIKAN
    const t = await sequelize.transaction();
    try {
        const akun = await DisgiatAsrama.findByPk(id_disgiat_asrama, { transaction: t }); // PERBAIKAN
        if (!akun) return res.status(404).json({ message: 'Akun Disgiat Asrama tidak ditemukan.' });
        if(akun.id_user) await User.destroy({ where: { id_user: akun.id_user }, transaction: t });
        await akun.destroy({ transaction: t });
        await t.commit();
        res.status(200).json({ message: 'Akun Disgiat Asrama berhasil dihapus.' });
    } catch (error) { await t.rollback(); res.status(500).json({ message: 'Gagal menghapus data Disgiat Asrama', error: error.message }); }
};


module.exports = {
    getAllWaliKamar, createWaliKamar, updateWaliKamar, destroyWaliKamar,
    getAllDisgiatAsrama, createDisgiatAsrama, updateDisgiatAsrama, destroyDisgiatAsrama,
};