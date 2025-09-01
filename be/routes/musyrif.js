// file: routes/musyrif.routes.js
const express = require('express');
const router = express.Router();
const musyrifController = require('../controllers/musyrif.js');

const authMiddleware = require('../middleware/auth.middleware');

// Middleware sekarang HANYA memeriksa apakah token valid,
// TIDAK memeriksa apakah rolenya 'Admin Asrama'.
// PERHATIAN: Ini berarti semua user yang login bisa mengakses fitur ini.
const verifyLogin = [authMiddleware.verifyToken];

// Endpoint utama untuk halaman
router.get('/kelas-musyrif', verifyLogin, musyrifController.getKelasData);

// Endpoint untuk modal list santri
router.get('/kelas-musyrif/:id_kelas/santri', verifyLogin, musyrifController.getSantriByKelas);

// Endpoint untuk dropdown pilihan musyrif
router.get('/musyrif/available', verifyLogin, musyrifController.getAvailableMusyrif);

// Endpoint untuk menyimpan perubahan musyrif
router.post('/kelas-musyrif/:id_kelas/assign', verifyLogin, musyrifController.assignMusyrifToKelas);

module.exports = router;