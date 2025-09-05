// file: routes/riwayatAbsen.js
const express = require('express');
const router = express.Router();

const controller = require("../controllers/riwayatAbsenSekolah.js");
// --- PERBAIKAN: Hapus 'isPegawai' dari import jika belum dibuat ---
const { verifyToken } = require("../middleware/auth.middleware.js"); 

// --- PERBAIKAN: Gunakan 'verifyToken' saja sebagai middleware ---
router.use(verifyToken);

// Mendapatkan daftar kelas yang pernah diabsen guru
router.get("/kelas", controller.getKelasRiwayat);

// Mendapatkan performa santri per kelas
// Contoh: /api/riwayat-absen/performance?id_kelas_sekolah=1
router.get("/performance", controller.getSantriPerformance);

// Mendapatkan detail riwayat per santri
// Contoh: /api/riwayat-absen/detail?id_santri=5
router.get("/detail", controller.getDetailRiwayatSantri);

module.exports = router;