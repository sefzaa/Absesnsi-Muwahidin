// file: controllers/pegawai.js
const { Pegawai, User, Jabatan, Role, sequelize } = require('../models');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// --- FUNGSI UNTUK JABATAN ---
exports.getAllJabatan = async (req, res) => {
    try {
        const jabatan = await Jabatan.findAll({ order: [['nama_jabatan', 'ASC']] });
        res.status(200).json(jabatan);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data jabatan', error: error.message });
    }
};

// --- FUNGSI CRUD UNTUK PEGAWAI ---

// 1. GET ALL PEGAWAI
exports.getAllPegawai = async (req, res) => {
    try {
        const pegawaiData = await Pegawai.findAll({
            include: [{
                model: Jabatan,
                attributes: ['nama_jabatan'],
            }, {
                model: User,
                attributes: ['username']
            }],
            order: [['nama', 'ASC']]
        });

        const formattedData = pegawaiData.map(p => ({
            id_pegawai: p.id_pegawai,
            nama: p.nama,
            nip: p.nip || '-',
            jenis_kelamin: p.jenis_kelamin === 'Laki-laki' ? 'Putra' : 'Putri',
            tempat_lahir: p.tempat_lahir,
            tanggal_lahir: p.tanggal_lahir,
            alamat: p.alamat,
            no_telp: p.no_telp,
            tahun_masuk: p.tahun_masuk,
            jabatan: p.Jabatan ? p.Jabatan.nama_jabatan : 'Tidak ada',
            username: p.User ? p.User.username : '-',
            id_jabatan: p.id_jabatan,
            id_user: p.id_user
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data pegawai.', error: error.message });
    }
};

// 2. CREATE PEGAWAI
exports.createPegawai = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const {
            nama, nip, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, no_telp, tahun_masuk,
            username, password,
            id_jabatan, jabatan_baru
        } = req.body;

        if (!nama || !nip || !username || !password || !id_jabatan) {
            return res.status(400).json({ message: 'Data wajib (nama, NIP, username, password, jabatan) tidak boleh kosong.' });
        }

        let finalJabatanId = id_jabatan;
        if (id_jabatan === 'lainnya' && jabatan_baru) {
            const [jabatan] = await Jabatan.findOrCreate({
                where: { nama_jabatan: jabatan_baru },
                defaults: { nama_jabatan: jabatan_baru },
                transaction: t
            });
            finalJabatanId = jabatan.id_jabatan;
        } else if (id_jabatan === 'lainnya' && !jabatan_baru) {
             return res.status(400).json({ message: 'Nama jabatan baru tidak boleh kosong.' });
        }

        let role = await Role.findOne({ where: { slug: 'pegawai' }, transaction: t });
        if (!role) {
            role = await Role.create({ nama_role: 'Pegawai', slug: 'pegawai' }, { transaction: t });
        }
        
        const dummyEmail = `${username.toLowerCase().replace(/\s+/g, '_')}-${uuidv4().slice(0,8)}@pesantren.local`;

        const newUser = await User.create({
            nama,
            username,
            email: dummyEmail,
            password: bcrypt.hashSync(password, 8),
            jenis_kelamin: jenis_kelamin,
            id_role: role.id_role
        }, { transaction: t });
        
        const jenisKelaminPegawai = jenis_kelamin === 'Putra' ? 'Laki-laki' : 'Perempuan';
        const finalNip = nip && nip.trim() === '-' ? null : nip;

        const newPegawai = await Pegawai.create({
            id_pegawai: `peg-${uuidv4()}`,
            id_jabatan: finalJabatanId,
            id_user: newUser.id_user,
            nama,
            nip: finalNip,
            jenis_kelamin: jenisKelaminPegawai,
            tempat_lahir,
            tanggal_lahir: tanggal_lahir || null,
            alamat,
            no_telp,
            tahun_masuk
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: 'Data pegawai baru berhasil disimpan.', data: newPegawai });
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
            const value = error.errors[0].value;
            return res.status(409).json({ message: `Gagal: ${field} '${value}' sudah digunakan.` });
        }
        res.status(500).json({ message: 'Gagal membuat data pegawai.', error: error.message });
    }
};

// 3. UPDATE PEGAWAI
exports.updatePegawai = async (req, res) => {
    const { id_pegawai } = req.params;
    const t = await sequelize.transaction();
    try {
        const {
            nama, nip, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, no_telp, tahun_masuk,
            password,
            id_jabatan, jabatan_baru
        } = req.body;

        const pegawai = await Pegawai.findByPk(id_pegawai, { include: [User], transaction: t });
        if (!pegawai) {
            return res.status(404).json({ message: 'Pegawai tidak ditemukan.' });
        }

        let finalJabatanId = id_jabatan;
        if (id_jabatan === 'lainnya' && jabatan_baru) {
            const [jabatan] = await Jabatan.findOrCreate({
                where: { nama_jabatan: jabatan_baru },
                defaults: { nama_jabatan: jabatan_baru },
                transaction: t
            });
            finalJabatanId = jabatan.id_jabatan;
        }

        if (pegawai.User) {
            pegawai.User.nama = nama;
            pegawai.User.jenis_kelamin = jenis_kelamin;

            if (password) {
                pegawai.User.password = bcrypt.hashSync(password, 8);
            }
            await pegawai.User.save({ transaction: t });
        }
        
        const jenisKelaminPegawai = jenis_kelamin === 'Putra' ? 'Laki-laki' : 'Perempuan';
        const finalNip = nip && nip.trim() === '-' ? null : nip;

        await pegawai.update({
            nama, 
            nip: finalNip, 
            jenis_kelamin: jenisKelaminPegawai,
            tempat_lahir, tanggal_lahir, alamat, no_telp, tahun_masuk,
            id_jabatan: finalJabatanId,
        }, { transaction: t });

        await t.commit();
        res.status(200).json({ message: 'Data pegawai berhasil diperbarui.', data: pegawai });
    } catch (error) {
        await t.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            const field = error.errors[0].path;
            const value = error.errors[0].value;
            return res.status(409).json({ message: `Gagal: ${field} '${value}' sudah digunakan.` });
        }
        res.status(500).json({ message: 'Gagal memperbarui data pegawai.', error: error.message });
    }
};

// 4. DELETE PEGAWAI
exports.deletePegawai = async (req, res) => {
    const { id_pegawai } = req.params;
    const t = await sequelize.transaction();
    try {
        const pegawai = await Pegawai.findByPk(id_pegawai, { transaction: t });
        if (!pegawai) {
            return res.status(404).json({ message: 'Pegawai tidak ditemukan.' });
        }

        const userId = pegawai.id_user;
        await pegawai.destroy({ transaction: t });

        if (userId) {
            await User.destroy({ where: { id_user: userId }, transaction: t });
        }

        await t.commit();
        res.status(200).json({ message: 'Pegawai berhasil dihapus.' });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ message: 'Gagal menghapus data pegawai.', error: error.message });
    }
};