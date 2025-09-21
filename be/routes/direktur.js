const express = require('express');
const router = express.Router();
const direkturController = require('../controllers/direktur.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

// Rute untuk mendapatkan data filter awal (daftar kelas)
router.get('/filters', verifyToken, direkturController.getInitialFilters);

// Rute utama untuk mendapatkan data rekap absensi
router.get('/rekap', verifyToken, direkturController.getRekapAbsensi);

// Rute untuk melihat detail absensi per santri
router.get('/detail-santri/:id_santri', verifyToken, direkturController.getDetailAbsensiSantri);

module.exports = router;

