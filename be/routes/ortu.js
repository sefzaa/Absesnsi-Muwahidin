// file: routes/ortu.routes.js
const authMiddleware = require("../middleware/auth.middleware.js");
const ortuController = require("../controllers/ortu.js");
var router = require("express").Router();

// Middleware untuk memastikan hanya orang tua yang bisa akses
const isOrtu = (req, res, next) => {
    if (req.user && req.user.role === 'orang-tua') {
        next();
    } else {
        res.status(403).send({ message: "Akses ditolak. Hanya untuk Orang Tua." });
    }
};

// Rute untuk mendapatkan daftar anak dari ortu yang login
router.get("/anak", [authMiddleware.verifyToken, isOrtu], ortuController.getAnakList);

// Rute untuk mendapatkan detail absensi per anak
router.get("/absensi/:id_santri", [authMiddleware.verifyToken, isOrtu], ortuController.getAbsensiDetail);

module.exports = router;
