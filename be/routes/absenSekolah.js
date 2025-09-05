// file: routes/absenSekolah.js
const express = require('express');
const router = express.Router();

// Impor controller dan middleware
const controller = require("../controllers/absenSekolah.js");
const { verifyToken } = require("../middleware/auth.middleware.js");

// Rute untuk mendapatkan data master yang dibutuhkan untuk form absensi
router.get(
    "/kelas-sekolah",
    verifyToken,
    controller.getKelasSekolah
);

router.get(
    "/jam-pelajaran", // pakai query ?id_kelas_sekolah=1&tanggal=2025-09-05
    verifyToken,
    controller.getJamPelajaran
);

router.get(
    "/santri/:id_kelas_sekolah",
    verifyToken,
    controller.getSantriByKelas
);

// RUTE BARU UNTUK MENGAMBIL DETAIL ABSENSI YANG SUDAH ADA
router.get(
    "/detail",
    verifyToken,
    controller.getAbsensiDetail
);

// Rute untuk MENYIMPAN atau MEMPERBARUI data absensi
router.post(
    "/save", // diganti dari /create
    verifyToken,
    controller.saveAbsensi // diganti dari createAbsensi
);

// --- RUTE BARU UNTUK SUMMARY ---
router.get("/summary", verifyToken, controller.getSummary);

module.exports = router;