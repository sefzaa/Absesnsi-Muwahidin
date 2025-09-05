// file: routes/rekapAbsenSekolah.js
const express = require('express');
const router = express.Router();

const controller = require("../controllers/rekapAbsenSekolah.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

// Endpoint utama untuk mengambil semua data rekap
// Contoh: /api/rekap-absen-sekolah?bulan=9&tahun=2025
router.get("/", verifyToken, controller.getRekap);

module.exports = router;