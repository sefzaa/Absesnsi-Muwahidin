// routes/rekapWaliKamar.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/rekapWaliKamar.js');

// Route untuk mendapatkan daftar semua santri
router.get('/santri-list', controller.getSantriList);

// Route untuk mendapatkan detail rekap per santri
router.get('/:id_santri', controller.getDetailRekap);

module.exports = router;
