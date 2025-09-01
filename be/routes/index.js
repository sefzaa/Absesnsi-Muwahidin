// routes/index.js

// Impor semua file rute yang ada
const jadwalRutinRoutes = require("./jadwalRutin.js");
const kegiatanTambahanRoutes = require("./kegiatanTambahan.js");
const santriRoutes = require("./santri.js");
const pegawaiRoutes = require("./pegawai.js");
const absensiRoutes = require("./absensi.js");
const authRoutes = require("./auth.routes.js");
const rekapWaliKamarRoutes = require("./rekapWaliKamar.js");
const musyrifRoutes = require("./musyrif.js");


// Buat objek untuk menampung semua rute
const router = {};

// Daftarkan setiap rute ke dalam objek
router.jadwalRutin = jadwalRutinRoutes;
router.kegiatanTambahan = kegiatanTambahanRoutes;
router.santri = santriRoutes;
router.pegawai = pegawaiRoutes;
router.absensi = absensiRoutes;
router.auth = authRoutes;
router.rekapWaliKamar = rekapWaliKamarRoutes;
router.musyrif = musyrifRoutes;


// Ekspor objek yang berisi semua rute
module.exports = router;