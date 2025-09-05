const express = require('express');
const router = express.Router();
const tuController = require('../controllers/absenPegawai.js');
const { verifyToken } = require('../middleware/auth.middleware.js');


// --- Absensi Routes ---
// Endpoint dasar ('/') sekarang digunakan untuk operasi CRUD absensi
router.post('/', verifyToken, tuController.createAbsensi);
router.get('/', verifyToken, tuController.getAllAbsensi);
router.get('/history/:id_pegawai', verifyToken, tuController.getAbsensiHistory);
router.put('/:id_absensi', verifyToken, tuController.updateAbsensi);
router.delete('/:id_absensi', verifyToken, tuController.deleteAbsensi);

// --- Master Data Routes ---
// Endpoint spesifik untuk mendapatkan data master pegawai dan jabatan
router.get('/pegawai', verifyToken, tuController.getAllPegawai);
router.get('/jabatan', verifyToken, tuController.getAllJabatan);

module.exports = router;

