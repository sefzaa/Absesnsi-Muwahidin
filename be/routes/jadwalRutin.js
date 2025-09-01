// routes/jadwalRutin.routes.js

const express = require("express");
const router = express.Router();

// Impor controller
const { create, findAll, update, destroy } = require("../controllers/jadwalRutin.js");

// Impor middleware otentikasi
const { verifyToken } = require('../middleware/auth.middleware');

// Terapkan middleware [verifyToken] pada semua rute di bawah

// Metode POST untuk membuat data baru
router.post("/create", [verifyToken], create);

// Metode GET untuk mengambil semua data
router.get("/", [verifyToken], findAll);

// Metode PUT untuk mengupdate data berdasarkan ID
router.put("/:id", [verifyToken], update);

// Metode DELETE untuk menghapus data berdasarkan ID
router.delete("/:id", [verifyToken], destroy);

module.exports = router;