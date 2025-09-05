// routes/index.js

// Impor semua file rute yang ada
const jadwalRutinRoutes = require("./jadwalRutin.js");
const kegiatanTambahanRoutes = require("./kegiatanTambahan.js");
const santriRoutes = require("./santri.js");
const pegawaiRoutes = require("./pegawai.js");
const absensiSantriRoutes = require("./absensiSantri.js");
const authRoutes = require("./auth.routes.js");
const rekapSantriRoutes = require("./rekapSantri.js");
const musyrifRoutes = require("./musyrif.js");
const kehadiranSantriRoutes = require("./kehadiranSantri.js");
const AbsenPegawaiRoutes = require("./absenPegawai.js");
const jamPelajaranRoutes = require("./jamPelajaran.js");
const kelasSekolahRoutes = require("./kelasSekolah.js");

// Buat objek untuk menampung semua rute
const router = {};

// Daftarkan setiap rute ke dalam objek
router.jadwalRutin = jadwalRutinRoutes;
router.kegiatanTambahan = kegiatanTambahanRoutes;
router.santri = santriRoutes;
router.pegawai = pegawaiRoutes;
router.absensiSantri = absensiSantriRoutes;
router.auth = authRoutes;
router.rekapSantri = rekapSantriRoutes;
router.musyrif = musyrifRoutes;
router.kehadiranSantri = kehadiranSantriRoutes;
router.absenPegawai = AbsenPegawaiRoutes;
router.jamPelajaran = jamPelajaranRoutes;
router.kelasSekolah = kelasSekolahRoutes;


// Ekspor objek yang berisi semua rute
module.exports = router;