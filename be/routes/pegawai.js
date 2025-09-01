// file: routes/pegawai.routes.js
const express = require('express');
const router = express.Router();
const pegawaiController = require('../controllers/pegawai.js');

// Import HANYA middleware untuk verifikasi token
const authMiddleware = require('../middleware/auth.middleware');

// Middleware sekarang HANYA memeriksa apakah token valid,
// TIDAK memeriksa apakah rolenya 'Admin Asrama'.
// PERHATIAN: Ini berarti semua user yang login bisa mengakses fitur ini.
const verifyLogin = [authMiddleware.verifyToken];

// --- Route untuk Jabatan ---
router.get('/jabatan', verifyLogin, pegawaiController.getAllJabatan);

// --- Route CRUD untuk Pegawai ---
router.get('/pegawai', verifyLogin, pegawaiController.getAllPegawai);
router.post('/pegawai', verifyLogin, pegawaiController.createPegawai);
router.put('/pegawai/:id_pegawai', verifyLogin, pegawaiController.updatePegawai);
router.delete('/pegawai/:id_pegawai', verifyLogin, pegawaiController.deletePegawai);

module.exports = router;

