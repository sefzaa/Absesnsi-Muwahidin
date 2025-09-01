// file: routes/tahfidzWaliKamar.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/tahfidzWaliKamar.js');
const { verifyToken } = require('../middleware/auth.middleware'); // <-- Impor middleware

// Terapkan middleware verifyToken ke semua rute di bawah
router.get('/', verifyToken, controller.getAllSantriProgress);
router.post('/', verifyToken, controller.createSetoran);
router.get('/history/:id_santri', verifyToken, controller.getHistoryBySantri);
router.get('/options/surah', verifyToken, controller.getSurahOptions);

module.exports = router;