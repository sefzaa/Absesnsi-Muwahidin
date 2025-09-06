// file: controllers/auth.controller.js

const db = require('../models');
const User = db.User;
const Role = db.Role;
// --- ▼▼▼ PERUBAHAN: Ganti WaliKamar dengan Pegawai dan Jabatan ▼▼▼ ---
const Pegawai = db.Pegawai;
const Jabatan = db.Jabatan;
// --- ▲▲▲ AKHIR PERUBAHAN ---
const Ortu = db.Ortu; // <-- TAMBAHKAN BARIS INI
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const jwtSecret = 'your_secret_key_here';

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({
            where: { username },
            include: [{ model: Role, attributes: ['nama_role', 'slug'] }]
        });

        if (!user) {
            return res.status(404).send({ message: 'User tidak ditemukan.' });
        }

        const passwordIsValid = await bcrypt.compare(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send({ message: 'Password salah.' });
        }

        let extraInfo = {};
        const userRoleSlug = user.Role.slug;

        // --- ▼▼▼ MODIFIKASI: Logika untuk Pegawai (Musyrif & TU) ▼▼▼ ---
        if (userRoleSlug === 'pegawai') {
            const pegawai = await Pegawai.findOne({
                where: { id_user: user.id_user },
                include: [{ model: Jabatan, attributes: ['nama_jabatan'] }]
            });

            if (pegawai && pegawai.Jabatan) {
                const namaJabatan = pegawai.Jabatan.nama_jabatan;

                if (namaJabatan === 'Musyrif') {
                    extraInfo = {
                        id_pegawai: pegawai.id_pegawai,
                        jenis_kelamin_pegawai: pegawai.jenis_kelamin,
                        jabatan: 'musyrif',
                    };
                // --- TAMBAHAN: Kondisi untuk Jabatan TU ---
                } else if (namaJabatan === 'TU') {
                    extraInfo = {
                        id_pegawai: pegawai.id_pegawai,
                        jabatan: 'tu', // Kirim flag jabatan TU ke frontend
                    };
                } 
                else if (namaJabatan === 'Guru') {
                    extraInfo = {
                        id_pegawai: pegawai.id_pegawai,
                        jabatan: 'guru', // Kirim flag jabatan TU ke frontend
                    };
                }
                else {
                    // Jabatan lain (selain Musyrif & TU) tidak diizinkan login melalui rute ini
                    return res.status(403).send({ message: 'Jabatan Anda tidak memiliki akses.' });
                }
            } else {
                // Jika user memiliki role 'pegawai' tapi data pegawai tidak ditemukan
                return res.status(404).send({ message: 'Data pegawai tidak ditemukan.' });
            }
        }
        else if (userRoleSlug === 'orang-tua') {
            const ortu = await Ortu.findOne({
                where: { id_user: user.id_user }
            });

            if (!ortu) {
                return res.status(404).send({ message: 'Data orang tua tidak ditemukan terhubung dengan akun ini.' });
            }
            extraInfo = {
                id_ortu: ortu.id_ortu // Kirim id_ortu untuk identifikasi
            };
        }

        // Logika untuk role lain seperti admin-asrama bisa tetap di sini jika ada
        else if (userRoleSlug === 'admin-asrama') {
            // Logika untuk admin-asrama (jika ada data spesifik yang perlu diambil)
            // contoh: extraInfo = { ... };
        }

        const tokenPayload = {
            id: user.id_user,
            nama: user.nama,
            jenis_kelamin: user.jenis_kelamin,
            role: user.Role.nama_role,
            slug: user.Role.slug,
            ...extraInfo
        };

        const token = jwt.sign(tokenPayload, jwtSecret, { expiresIn: '24h' });

        res.status(200).send({
            id: user.id_user,
            username: user.username,
            email: user.email,
            nama: user.nama,
            jenis_kelamin: user.jenis_kelamin,
            role: user.Role.nama_role,
            slug: user.Role.slug,
            ...extraInfo, // Kirim juga di response body
            accessToken: token,
        });

    } catch (error) {
        console.error("Error during login process:", error);
        res.status(500).send({ message: "Terjadi kesalahan internal. Periksa log server untuk detail." });
    }
};