const express = require('express');
const router = express.Router();
const santriController = require('../controllers/santri.js');

// 1. Impor middleware verifyToken
const { verifyToken } = require('../middleware/auth.middleware');

// 2. Terapkan middleware [verifyToken] pada setiap rute yang perlu dilindungi

// Mendapatkan semua santri (sekarang sudah dilindungi)
router.get('/', [verifyToken], santriController.getAll);

// Mengupdate santri berdasarkan ID (sekarang sudah dilindungi)
router.put('/:id', [verifyToken], santriController.update);

// Mendapatkan daftar semua kelas (sekarang sudah dilindungi)
router.get('/kelas', [verifyToken], santriController.getAllKelas);

module.exports = router;