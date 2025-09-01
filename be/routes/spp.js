// routes/spp.js
const express = require('express');
const router = express.Router();

// Impor controller yang berisi logika
const sppController = require('../controllers/spp.js');

// Definisikan rute untuk setiap aksi CRUD
// GET /api/spp -> Mengambil semua data
router.get('/', sppController.getAll);

// POST /api/spp -> Membuat data baru
router.post('/', sppController.create);

// PUT /api/spp/:id -> Memperbarui data berdasarkan ID
router.put('/:id', sppController.update);

// DELETE /api/spp/:id -> Menghapus data berdasarkan ID
router.delete('/:id', sppController.destroy);

module.exports = router;
