// Ini untuk ubah password

const db = require('../models');
const User = db.User;
const bcrypt = require('bcryptjs');

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id_user; // Diambil dari token JWT setelah verifikasi
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).send({ message: "Password lama dan baru harus diisi." });
        }
        
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).send({ message: "User tidak ditemukan." });
        }

        const passwordIsValid = await bcrypt.compare(oldPassword, user.password);
        if (!passwordIsValid) {
            return res.status(401).send({ message: "Password lama salah." });
        }
        
        const hashedNewPassword = await bcrypt.hash(newPassword, 8);

        await user.update({ password: hashedNewPassword });

        res.status(200).send({ message: "Password berhasil diubah." });

    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).send({ message: "Terjadi kesalahan saat mengubah password." });
    }
};
