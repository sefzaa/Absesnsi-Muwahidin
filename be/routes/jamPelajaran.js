const express = require('express');
const router = express.Router();
const jamPelajaranController = require('../controllers/jamPelajaran.js');
const { verifyToken } = require('../middleware/auth.middleware.js'); // Asumsi middleware Anda ada di sini

// Lindungi semua rute dengan verifikasi token
router.use(verifyToken);

router.post('/', jamPelajaranController.createJamPelajaran);
router.get('/', jamPelajaranController.getAllJamPelajaran);
router.put('/:id', jamPelajaranController.updateJamPelajaran);
router.delete('/:id', jamPelajaranController.deleteJamPelajaran);

module.exports = router;