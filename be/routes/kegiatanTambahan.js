// routes/kegiatanTambahan.js

const express = require("express");
const router = express.Router();

// Impor controller
const { create, findAll, update, destroy } = require("../controllers/kegiatanTambahan.js");

// Impor middleware otentikasi
const { verifyToken } = require('../middleware/auth.middleware');

// Terapkan middleware [verifyToken] pada semua rute

// Endpoint untuk membuat kegiatan tambahan baru
router.post("/create", [verifyToken], create);

// Endpoint untuk mengambil semua kegiatan tambahan
router.get("/", [verifyToken], findAll);

// Endpoint untuk mengupdate kegiatan tambahan berdasarkan id
router.put("/:id", [verifyToken], update);

// Endpoint untuk menghapus kegiatan tambahan berdasarkan id
router.delete("/:id", [verifyToken], destroy);

module.exports = router;