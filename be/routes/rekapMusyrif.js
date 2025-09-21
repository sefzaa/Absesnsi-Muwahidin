const express = require('express');
const router = express.Router();
const rekapMusyrifController = require('../controllers/rekapMusyrif.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

// Rute untuk mendapatkan semua musyrif
router.get('/', [verifyToken], rekapMusyrifController.getAllMusyrif);

// Rute untuk mendapatkan semua data untuk diunduh
router.get('/all', [verifyToken], rekapMusyrifController.getRekapForDownload);

// Rute untuk detail rekap per musyrif
router.get('/:id_pegawai', [verifyToken], rekapMusyrifController.getRekapMusyrifDetail);

module.exports = router;
