const jwt = require('jsonwebtoken');
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
            include: [{ model: Role, attributes: ['slug', 'nama_role'] }]
        });

        if (!user) {
            return res.status(404).json({ message: 'User yang terkait dengan token ini tidak ditemukan.' });
        }
        
        let pegawaiInfo = {
            nama: user.nama,
            jabatan: null,
            jabatan_slug: null,
            jenis_kelamin: user.jenis_kelamin,
            id_pegawai: null
        };

        if (user.Role.slug === 'pegawai') {
            const pegawai = await Pegawai.findOne({ 
                where: { id_user: user.id_user },
                include: [{ model: Jabatan, attributes: ['nama_jabatan'] }]
            });

            if (pegawai && pegawai.Jabatan) {
                const namaJabatan = pegawai.Jabatan.nama_jabatan;
                let jabatanSlug = ''; // Variabel untuk menyimpan versi huruf kecil

                // Konversi nama jabatan ke slug (huruf kecil)
                if (namaJabatan === 'Musyrif') jabatanSlug = 'musyrif';
                else if (namaJabatan === 'TU') jabatanSlug = 'tu';
                else if (namaJabatan === 'Guru') jabatanSlug = 'guru';
                else if (namaJabatan === 'Direktur') jabatanSlug = 'direktur';

                pegawaiInfo = {
                    nama: pegawai.nama,
                    jabatan: namaJabatan, // Nama asli (misal: "Direktur")
                    jabatan_slug: jabatanSlug, // Versi slug (misal: "direktur")
                    jenis_kelamin: pegawai.jenis_kelamin,
                    id_pegawai: pegawai.id_pegawai,
                };
            }
        }
        
        // --- PERBAIKAN UTAMA DI SINI ---
        req.user = {
            id_user: user.id_user,
            username: user.username,
            nama: pegawaiInfo.nama,
            role: user.Role.slug,
            role_name: user.Role.nama_role,
            // Gunakan versi slug untuk konsistensi
            jabatan: pegawaiInfo.jabatan_slug, 
            jenis_kelamin: pegawaiInfo.jenis_kelamin,
            id_pegawai: pegawaiInfo.id_pegawai,
        };

        next();
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).send({ message: 'Unauthorized! Token tidak valid.' });
    }
};