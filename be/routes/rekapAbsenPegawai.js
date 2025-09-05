// file: routes/rekapAbsenPegawai.js
const express = require('express');
const router = express.Router();

const controller = require("../controllers/rekapAbsenPegawai.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

// Endpoint utama untuk mengambil semua data rekap pegawai
// Contoh: /api/rekap-absen-pegawai?bulan=9&tahun=2025
router.get("/", verifyToken, controller.getRekap);

module.exports = router;