// file: routes/absensi.js
const express = require('express');
const router = express.Router();
const absensiController = require('../controllers/absensiSantri.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

// Rute ini sudah benar, hanya perlu memastikan middleware terpasang
router.get('/kegiatan-hari-ini', verifyToken, absensiController.getKegiatanHariIni);

// REVISI: Hapus `:id_wali_kamar` dari URL. ID akan diambil dari token.
// Rute menjadi lebih bersih dan aman.
router.get('/detail/:id_kegiatan_unik/santri', verifyToken, absensiController.getSantriForAbsensi);

// Rute ini sudah benar, hanya perlu memastikan middleware terpasang
router.post('/detail/:id_kegiatan_unik', verifyToken, absensiController.saveAbsensi);

module.exports = router;