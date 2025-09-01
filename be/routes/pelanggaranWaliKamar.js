// file: routes/pelanggaranWaliKamar.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/pelanggaranWaliKamar.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

router.use(verifyToken);

router.get('/records', controller.getPelanggaranRecords);
router.post('/records', controller.createPelanggaranRecord);
router.put('/records/:id', controller.updatePelanggaranRecord);
router.delete('/records/:id', controller.deletePelanggaranRecord);

router.get('/options/kelas', controller.getKelasOptions);
router.get('/options/santri/:id_kelas', controller.getSantriByKelasOptions);
router.get('/options/jenis-pelanggaran', controller.getJenisPelanggaranOptions);

module.exports = router;
