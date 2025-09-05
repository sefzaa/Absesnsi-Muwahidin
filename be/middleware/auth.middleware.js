// file: middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
// --- TAMBAHAN: Import model Jabatan ---
const { User, Pegawai, Role, Jabatan } = require('../models'); 

const jwtSecret = process.env.JWT_SECRET || 'your_secret_key_here'; 

exports.verifyToken = async (req, res, next) => {
    let token = req.headers['x-access-token'];

    if (!token) {
        return res.status(403).send({ message: 'Token tidak tersedia!' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        
        const user = await User.findByPk(decoded.id, {
            include: [{
                model: Role,
                attributes: ['slug', 'nama_role'] // Ambil juga nama_role untuk admin
            }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User yang terkait dengan token ini tidak ditemukan.' });
        }
        
        const pegawai = await Pegawai.findOne({ 
            where: { id_user: user.id_user },
            // --- TAMBAHAN: Sertakan model Jabatan saat query ---
            include: [{
                model: Jabatan,
                attributes: ['nama_jabatan']
            }]
        });

        // --- PERBAIKAN LOGIKA 'jenis_kelamin' DI SINI ---
        req.user = {
            id_user: user.id_user,
            username: user.username,
            nama: pegawai ? pegawai.nama : user.nama,
            role: user.Role.slug,
            role_name: user.Role.nama_role,
            jabatan: pegawai && pegawai.Jabatan ? pegawai.Jabatan.nama_jabatan : null,
            // Jika user adalah pegawai, gunakan jenis kelamin pegawai.
            // Jika bukan (admin), gunakan jenis kelamin dari user.
            jenis_kelamin: pegawai ? pegawai.jenis_kelamin : user.jenis_kelamin,
            id_pegawai: pegawai ? pegawai.id_pegawai : null,
        };
        // --- AKHIR PERBAIKAN ---


        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).send({ message: 'Unauthorized! Token tidak valid.' });
    }
};