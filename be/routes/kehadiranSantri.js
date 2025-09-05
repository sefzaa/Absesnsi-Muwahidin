// routes/kehadiranSantri.js

const express = require('express');
const router = express.Router();
const kehadiranController = require('../controllers/kehadiranSantri.js');
// Menggunakan middleware verifyToken dari file yang Anda berikan
const { verifyToken } = require('../middleware/auth.middleware');

/**
 * Middleware untuk otorisasi berdasarkan peran (role).
 * Fungsi ini memeriksa apakah req.user.role yang didapat dari verifyToken
 * termasuk dalam daftar peran yang diizinkan.
 * @param {string[]} allowedRoles - Array berisi slug peran yang diizinkan, contoh: ['admin-asrama']
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Pastikan req.user ada dan memiliki properti role
    if (!req.user || !req.user.role) {
      return res.status(403).send({ message: 'Forbidden: Role tidak ditemukan pada pengguna!' });
    }

    const hasRole = allowedRoles.includes(req.user.role);
    
    if (!hasRole) {
      return res.status(403).send({ message: 'Forbidden: Anda tidak memiliki akses yang diperlukan!' });
    }

    // Jika peran sesuai, lanjutkan ke controller
    next();
  };
};


// Rute untuk mendapatkan semua kelas
// Hanya dapat diakses oleh 'admin-asrama'
router.get('/kelas', verifyToken, authorize(['admin-asrama']), kehadiranController.getAllKelas);

// Rute untuk mendapatkan semua santri dengan filter
// Hanya dapat diakses oleh 'admin-asrama'
router.get('/santri', verifyToken, authorize(['admin-asrama']), kehadiranController.getAllSantri);

// Rute untuk mendapatkan detail absensi seorang santri
// Hanya dapat diakses oleh 'admin-asrama'
router.get('/absensi/:id_santri', verifyToken, authorize(['admin-asrama']), kehadiranController.getAbsensiSantri);

// Rute untuk mendapatkan data rekap yang akan dicetak ke PDF
// Hanya dapat diakses oleh 'admin-asrama'
router.get('/rekap-cetak', verifyToken, authorize(['admin-asrama']), kehadiranController.getRekapUntukCetak);


module.exports = router;

