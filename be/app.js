// file: app.js

const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const path = require('path');

// Impor object db yang berisi semua model dan koneksi sequelize
const db = require('./models');

// Impor objek yang berisi semua rute dari routes/index.js
const allRoutes = require('./routes');

const PORT = process.env.PORT || 3000;

// Panggil middleware cors di bagian paling atas
app.use(cors());

// Middleware untuk parsing body request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file statis dari folder 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- PENDAFTARAN RUTE ---
// Base route untuk health check
app.get('/', (req, res) => {
    res.json({ message: 'Selamat datang di API Sistem Informasi Pondok Pesantren.' });
});

// Pendaftaran semua rute API
app.use('/api/jadwal-rutin', allRoutes.jadwalRutin);
app.use('/api/kegiatan-tambahan', allRoutes.kegiatanTambahan);
app.use('/api/santri', allRoutes.santri);
app.use('/api/absensi', allRoutes.absensiSantri); // <-- TAMBAHKAN BARIS INI
app.use('/api/auth', allRoutes.auth); // <-- TAMBAHKAN BARIS INI
app.use('/api/rekap', allRoutes.rekapSantri);
app.use('/api', allRoutes.pegawai); // <-- TAMBAHKAN BARIS INI
app.use('/api', allRoutes.musyrif); // <-- TAMBAHKAN BARIS INI
app.use('/api/kehadiran-santri', allRoutes.kehadiranSantri); // <-- TAMBAHKAN BARIS INI
app.use('/api/absen-pegawai', allRoutes.absenPegawai); // <-- TAMBAHKAN BARIS INI
app.use('/api/jam-pelajaran', allRoutes.jamPelajaran); // <-- TAMBAHKAN BARIS INI
app.use('/api/kelas-sekolah', allRoutes.kelasSekolah); // <-- TAMBAHKAN BARIS INI
app.use('/api/absen-sekolah', allRoutes.absenSekolah); // <-- TAMBAHKAN BARIS INI
app.use('/api/riwayat-absen', allRoutes.riwayatAbsenSekolah); // <-- TAMBAHKAN BARIS INI
app.use('/api/rekap-absen-sekolah', allRoutes.rekapAbsenSekolah); // <-- TAMBAHKAN BARIS INI
app.use('/api/rekap-absen-pegawai', allRoutes.rekapAbsenPegawai); // <-- TAMBAHKAN BARIS INI


// --- SINKRONISASI DATABASE DAN JALANKAN SERVER ---
// PERUBAHAN DI SINI: Opsi { alter: true } dihapus untuk menghindari bug penambahan index berulang
db.sequelize.sync()
  .then(async () => {
    console.log("✅ Database berhasil disinkronkan.");
    
    try {
      // Autentikasi koneksi untuk memastikan koneksi masih valid
      await db.sequelize.authenticate();
      console.log('🐳 Koneksi ke database berhasil.');

      // Jalankan server HANYA SETELAH sinkronisasi dan autentikasi berhasil
      app.listen(PORT, () => {
        console.log(`👀 Server berjalan di port ${PORT}.`);
      });

    } catch (error) {
      console.error('🆘 Tidak dapat terhubung ke database setelah sinkronisasi:', error);
    }
  })
  .catch((error) => {
    console.error("❌ Gagal melakukan sinkronisasi database:", error);
  });
