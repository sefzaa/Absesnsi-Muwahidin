// file: routes/rekapGuru.routes.js
const express = require('express');
const router = express.Router();
const rekapGuruController = require('../controllers/rekapGuru.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

// --- ▼▼▼ ROUTE BARU: Diletakkan sebelum route dinamis /:id_pegawai ▼▼▼ ---
// Rute untuk mendapatkan semua data rekap (untuk download)
router.get('/all', [verifyToken], rekapGuruController.getRekapUntukSemuaGuru);

// Rute untuk mendapatkan semua pegawai dengan jabatan 'Guru'
router.get('/', [verifyToken], rekapGuruController.getAllGuru);

// Rute untuk mendapatkan detail rekap absensi seorang guru
// contoh: /api/rekap-guru/peg-xxxx?bulan=9&tahun=2025
router.get('/:id_pegawai', [verifyToken], rekapGuruController.getRekapGuruDetail);

module.exports = router;