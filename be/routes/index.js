// routes/index.js

// Impor semua file rute yang ada
const jadwalRutinRoutes = require("./jadwalRutin.js");
const kegiatanTambahanRoutes = require("./kegiatanTambahan.js");
const sppRoutes = require("./spp.js");
const pelanggaranAsramaRoutes = require("./pelanggaranAsrama.js");
const santriRoutes = require("./santri.js");
const manageAkunRoutes = require("./manageAkun.js");
const manageKamarRoutes = require("./manageKamar.js");
const absensiRoutes = require("./absensi.js");
const authRoutes = require("./auth.routes.js");
const hafalanRoutes = require("./hafalan.js"); // <-- TAMBAHKAN INI
const pelanggaranWaliKamarRoutes = require("./pelanggaranWaliKamar.js"); // <-- TAMBAHKAN INI
const perizinanWaliKamarRoutes = require("./perizinanWaliKamar.js");
const prestasiWaliKamarRoutes = require("./prestasiWaliKamar.js");
const tahfidzWaliKamarRoutes = require("./tahfidzWaliKamar.js");
const rekapWaliKamarRoutes = require("./rekapWaliKamar.js");
const perizinanDGARoutes = require("./perizinanDGA.js"); // <-- TAMBAHKAN INI



// Buat objek untuk menampung semua rute
const router = {};

// Daftarkan setiap rute ke dalam objek
router.jadwalRutin = jadwalRutinRoutes;
router.kegiatanTambahan = kegiatanTambahanRoutes;
router.spp = sppRoutes;
router.pelanggaranAsrama = pelanggaranAsramaRoutes;
router.santri = santriRoutes;
router.manageAkun = manageAkunRoutes;
router.manageKamar = manageKamarRoutes;
router.absensi = absensiRoutes;
router.auth = authRoutes;
router.hafalan = hafalanRoutes; // <-- TAMBAHKAN INI
router.pelanggaranWaliKamar = pelanggaranWaliKamarRoutes; // <-- TAMBAHKAN INI
router.perizinanWaliKamar = perizinanWaliKamarRoutes;
router.prestasiWaliKamar = prestasiWaliKamarRoutes;
router.tahfidzWaliKamar = tahfidzWaliKamarRoutes;
router.rekapWaliKamar = rekapWaliKamarRoutes;
router.perizinanDGA = perizinanDGARoutes; // <-- TAMBAHKAN INI


// Ekspor objek yang berisi semua rute
module.exports = router;