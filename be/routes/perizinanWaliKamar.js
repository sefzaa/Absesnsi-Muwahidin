// routes/perizinanWaliKamar.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/perizinanWaliKamar.js');
const { verifyToken } = require('../middleware/auth.middleware.js'); // Impor middleware

// --- MODIFIKASI: Terapkan middleware verifyToken ke semua rute ---
router.get('/', verifyToken, controller.getAllPerizinan);
router.post('/', verifyToken, controller.createPerizinan);
router.put('/:id', verifyToken, controller.updatePerizinan);
router.put('/laporan-pulang/:id', verifyToken, controller.laporanPulang);

// Routes for form options juga diproteksi
router.get('/options/santri', verifyToken, controller.getSantriOptions);
router.get('/options/jenis-izin', verifyToken, controller.getJenisIzinOptions);
// --- Akhir Modifikasi ---

module.exports = router;
