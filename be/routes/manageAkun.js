// routes/manageAkun.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const manageAkunController = require('../controllers/manageAkun.js');
const upload = require('../middleware/upload.js');
const { verifyToken } = require('../middleware/auth.middleware'); // Impor verifyToken

const handleUpload = (req, res, next) => {
  const uploadHandler = upload.single('avatar');
  uploadHandler(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File terlalu besar, maksimal 1MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message || String(err) });
    }
    next();
  });
};

// ===========================================
// ===      ROUTES UNTUK WALI KAMAR        ===
// ===========================================
router.get('/wali-kamar', [verifyToken], manageAkunController.getAllWaliKamar);
router.post('/wali-kamar', [verifyToken, handleUpload], manageAkunController.createWaliKamar);
router.put('/wali-kamar/:id', [verifyToken, handleUpload], manageAkunController.updateWaliKamar);
router.delete('/wali-kamar/:id', [verifyToken], manageAkunController.destroyWaliKamar);

// ===========================================
// ===     ROUTES UNTUK DISGIAT ASRAMA     ===
// ===========================================
router.get('/disgiat-asrama', [verifyToken], manageAkunController.getAllDisgiatAsrama);
router.post('/disgiat-asrama', [verifyToken, handleUpload], manageAkunController.createDisgiatAsrama);
// PERUBAHAN: Parameter diubah dari :id menjadi :id_disgiat_asrama
router.put('/disgiat-asrama/:id_disgiat_asrama', [verifyToken, handleUpload], manageAkunController.updateDisgiatAsrama);
router.delete('/disgiat-asrama/:id_disgiat_asrama', [verifyToken], manageAkunController.destroyDisgiatAsrama);


module.exports = router;