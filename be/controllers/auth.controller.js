// file: controllers/auth.controller.js

const db = require('../models');
const User = db.User;
const Role = db.Role;
const WaliKamar = db.WaliKamar;
// PENAMBAHAN: Import model DisgiatAsrama
// Pastikan nama model 'DisgiatAsrama' sesuai dengan yang Anda definisikan di /models/index.js
const DisgiatAsrama = db.DisgiatAsrama;
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

        if (userRoleSlug === 'wali-kamar') {
            const waliKamar = await WaliKamar.findOne({
                where: { id_user: user.id_user },
                attributes: ['id_wali_kamar', 'jenis_kelamin', 'avatar']
            });

            if (waliKamar) {
                extraInfo = {
                    id_wali_kamar: waliKamar.id_wali_kamar,
                    jenis_kelamin_wk: waliKamar.jenis_kelamin,
                    avatar: waliKamar.avatar
                };
            } else {
                return res.status(404).send({ message: 'Data Wali Kamar untuk user ini tidak ditemukan.' });
            }
        }
        // --- ▼▼▼ MODIFIKASI BARU UNTUK DISGIAT ASRAMA ▼▼▼ ---
        else if (userRoleSlug === 'disgiat-asrama') {
            const disgiatAsrama = await DisgiatAsrama.findOne({
                where: { id_user: user.id_user },
                attributes: ['id_disgiat_asrama', 'jenis_kelamin', 'avatar']
            });

            if (disgiatAsrama) {
                extraInfo = {
                    id_disgiat_asrama: disgiatAsrama.id_disgiat_asrama,
                    // Kita gunakan nama properti yang spesifik untuk menghindari tumpang tindih
                    jenis_kelamin_disgiat: disgiatAsrama.jenis_kelamin,
                    avatar: disgiatAsrama.avatar
                };
            } else {
                return res.status(404).send({ message: 'Data Disgiat Asrama untuk user ini tidak ditemukan.' });
            }
        }
        // --- ▲▲▲ AKHIR MODIFIKASI ---

        const tokenPayload = {
            id: user.id_user,
            nama: user.nama,
            jenis_kelamin: user.jenis_kelamin, // jenis_kelamin umum dari tabel User
            role: user.Role.nama_role,
            slug: user.Role.slug,
            ...extraInfo // Info spesifik role (misal: id_wali_kamar, jenis_kelamin_wk, ATAU id_disgiat_asrama, jenis_kelamin_disgiat)
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