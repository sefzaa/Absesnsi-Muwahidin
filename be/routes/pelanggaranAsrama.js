// routes/pelanggaranAsrama.js
const express = require('express');
const router = express.Router();
const pelanggaranAsramaController = require('../controllers/pelanggaranAsrama.js');

// Impor middleware otentikasi
const { verifyToken } = require('../middleware/auth.middleware');

// Terapkan middleware pada semua rute
router.get('/', [verifyToken], pelanggaranAsramaController.getAll);
router.post('/', [verifyToken], pelanggaranAsramaController.create);
router.put('/:id_pelanggaran', [verifyToken], pelanggaranAsramaController.update);
router.delete('/:id_pelanggaran', [verifyToken], pelanggaranAsramaController.destroy);

module.exports = router;