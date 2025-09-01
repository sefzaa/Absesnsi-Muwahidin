const express = require('express');
const router = express.Router();
const perizinanController = require('../controllers/perizinanDGA.js');
const { verifyToken } = require("../middleware/auth.middleware");

router.use(verifyToken);
router.get('/harian', perizinanController.getIzinHarian);
router.get('/mingguan', perizinanController.getIzinMingguan);
router.get('/pulang', perizinanController.getIzinPulang);
router.post('/', perizinanController.createPerizinan);
router.put('/:id', perizinanController.updatePerizinan);
router.get('/santri-list', perizinanController.getAllSantri);

module.exports = router;