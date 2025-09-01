// file: route/managekamar.js

const express = require('express');
const router = express.Router();
const kamarController = require('../controllers/manageKamar');
const { verifyToken } = require('../middleware/auth.middleware'); // <-- Import middleware

// Terapkan middleware verifyToken ke semua rute di file ini
router.use(verifyToken);

// Endpoint untuk Asrama dan Kamar
router.get('/asrama', kamarController.getAllAsramaWithKamar);
router.post('/asrama', kamarController.createAsrama);
router.delete('/asrama/:id_asrama', kamarController.deleteAsrama);

router.post('/asrama/:id_asrama/kamar', kamarController.addKamarToAsrama);
router.put('/kamar/:id_kamar', kamarController.updateKamar);
router.delete('/kamar/:id_kamar', kamarController.deleteKamar);

// Endpoint untuk Wali Kamar
router.get('/wali-kamar-list', kamarController.getWaliKamarList);

// Endpoint untuk pengelolaan Santri dalam Kamar
router.get('/kamar/:id_kamar/santri', kamarController.getSantriInKamar);
router.get('/kamar/:id_kamar/santri-available', kamarController.getSantriAvailable);
router.post('/kamar/:id_kamar/santri', kamarController.addSantriToKamar);
router.delete('/kamar/:id_kamar/santri/:id_santri', kamarController.removeSantriFromKamar);

// Endpoint untuk fitur Acak Santri Otomatis
router.post('/asrama/:id_asrama/acak-otomatis', kamarController.acakSantriOtomatis);

module.exports = router;