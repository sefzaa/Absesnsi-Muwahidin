// middleware/upload.js
const multer = require('multer');
const path = require('path');

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Menentukan folder untuk menyimpan file yang diunggah
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    // Membuat nama file yang unik untuk menghindari konflik
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter file untuk memastikan hanya gambar yang diunggah
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb('Error: Hanya file gambar (jpeg, jpg, png, webp) yang diizinkan!');
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024 // Batas ukuran file 1MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
