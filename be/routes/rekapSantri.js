// file: routes/rekap.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/rekapSantri.js'); // Nama controller juga akan kita ubah
const { verifyToken } = require('../middleware/auth.middleware.js');

// Route untuk mendapatkan daftar santri yang diasuh oleh musyrif yang login
router.get('/santri-asuhan', verifyToken, controller.getSantriAsuhan);

// Route untuk mendapatkan detail rekap per santri
router.get('/:id_santri', verifyToken, controller.getDetailRekap);



module.exports = router;