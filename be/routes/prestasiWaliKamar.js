// routes/prestasiWaliKamar.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/prestasiWaliKamar.js');
const { verifyToken } = require('../middleware/auth.middleware.js'); // Impor middleware

// --- MODIFIKASI: Terapkan middleware verifyToken ke semua rute ---
router.get('/', verifyToken, controller.getAllPrestasi);
router.post('/', verifyToken, controller.createPrestasi);
router.put('/:id', verifyToken, controller.updatePrestasi);
router.delete('/:id', verifyToken, controller.deletePrestasi);

// Route untuk mengisi data form juga diproteksi
router.get('/options/santri', verifyToken, controller.getSantriOptions);

module.exports = router;
