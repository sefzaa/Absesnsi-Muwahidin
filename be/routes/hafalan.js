// file: routes/hafalan.js
const express = require('express');
const router = express.Router();
const hafalanController = require('../controllers/hafalan.js');
const { verifyToken } = require('../middleware/auth.middleware'); // <-- Impor middleware

// Terapkan middleware dan sesuaikan nama fungsi controller
router.get('/', verifyToken, hafalanController.getHafalanProgressByWaliKamar);
router.get('/history/:id_santri', verifyToken, hafalanController.getHafalanHistory);
router.post('/progress', verifyToken, hafalanController.addHafalanProgress);

module.exports = router;