const express = require('express');
const router = express.Router();
const santriController = require('../controllers/santri.js');
const { verifyToken } = require('../middleware/auth.middleware');

// Terapkan middleware [verifyToken] pada semua rute di bawah ini
router.use(verifyToken);

// ====================================================================
// ===            PENTING: URUTAN RUTE TELAH DIPERBAIKI             ===
// ====================================================================
// Rute yang spesifik seperti '/kelas' dan '/promote' harus diletakkan
// SEBELUM rute dinamis seperti '/:id' agar tidak salah ditangkap.
// --------------------------------------------------------------------

// Mendapatkan daftar semua kelas (untuk form)
router.get('/kelas', santriController.getAllKelas);

// Menjalankan proses kenaikan kelas massal
router.post('/promote', santriController.promoteAll);

// --- Rute CRUD Standar ---

// Mendapatkan semua santri (sesuai role admin)
router.get('/', santriController.getAll);

// Mendapatkan satu santri berdasarkan ID
router.get('/:id', santriController.getById);

// Menambahkan santri baru
router.post('/', santriController.create);

// Mengupdate santri berdasarkan ID
router.put('/:id', santriController.update);

module.exports = router;
