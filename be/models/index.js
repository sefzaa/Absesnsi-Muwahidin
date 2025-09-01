// file: models/index.js

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const fs = require('fs');
const path = require('path');

const db = {};

// Secara otomatis membaca semua file model di dalam direktori ini
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== path.basename(__filename)) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

// ======================================================
// ===          DEFINISI RELASI ANTAR MODEL           ===
// ======================================================

// --- Relasi Akun dan Peran (Users & Roles) ---
db.Role.hasMany(db.User, { foreignKey: 'id_role' });
db.User.belongsTo(db.Role, { foreignKey: 'id_role' });

db.User.hasOne(db.WaliKamar, { foreignKey: 'id_user' });
db.WaliKamar.belongsTo(db.User, { foreignKey: 'id_user' });

db.User.hasOne(db.DisgiatAsrama, { foreignKey: 'id_user' });
db.DisgiatAsrama.belongsTo(db.User, { foreignKey: 'id_user' });

db.User.hasOne(db.Ortu, { foreignKey: 'id_user' });
db.Ortu.belongsTo(db.User, { foreignKey: 'id_user' });


// --- Relasi Asrama, Kamar, dan Santri ---
db.Asrama.hasMany(db.Kamar, { foreignKey: 'id_asrama' });
db.Kamar.belongsTo(db.Asrama, { foreignKey: 'id_asrama' });

db.WaliKamar.hasMany(db.Kamar, { foreignKey: 'id_wali_kamar' });
db.Kamar.belongsTo(db.WaliKamar, { foreignKey: 'id_wali_kamar' });

db.Santri.belongsTo(db.Kelas, { foreignKey: 'id_kelas' });
db.Kelas.hasMany(db.Santri, { foreignKey: 'id_kelas' });

db.Santri.belongsTo(db.Ortu, { foreignKey: 'id_ortu' });
db.Ortu.hasMany(db.Santri, { foreignKey: 'id_ortu' });

db.Santri.belongsTo(db.Asrama, { foreignKey: 'id_asrama' });
db.Asrama.hasMany(db.Santri, { foreignKey: 'id_asrama' });

db.Santri.belongsTo(db.Kamar, { foreignKey: 'id_kamar' });
db.Kamar.hasMany(db.Santri, { foreignKey: 'id_kamar' });


// --- Relasi Lain-lain (Prestasi, Pelanggaran, Izin, dll) ---
db.Santri.hasMany(db.Prestasi, { foreignKey: 'id_santri' });
db.Prestasi.belongsTo(db.Santri, { foreignKey: 'id_santri' });

db.Santri.hasMany(db.Hafalan, { foreignKey: 'id_santri' });
db.Hafalan.belongsTo(db.Santri, { foreignKey: 'id_santri' });

db.Santri.hasMany(db.DetailSakit, { foreignKey: 'id_santri' });
db.DetailSakit.belongsTo(db.Santri, { foreignKey: 'id_santri' });

// Relasi Izin Asrama
// DetailIzinAsrama adalah model pusat, bukan sekadar tabel penghubung
db.Santri.hasMany(db.DetailIzinAsrama, { foreignKey: 'id_santri' });
db.IzinAsrama.hasMany(db.DetailIzinAsrama, { foreignKey: 'id_izin_asrama' });

db.DetailIzinAsrama.belongsTo(db.Santri, { foreignKey: 'id_santri', as: 'Santri' });
db.DetailIzinAsrama.belongsTo(db.IzinAsrama, { foreignKey: 'id_izin_asrama' });

// --- BAGIAN YANG DIPERBAIKI ---
// Mengganti relasi Pelanggaran Asrama menjadi One-to-Many
db.Santri.hasMany(db.DetailPelanggaranAsrama, { foreignKey: 'id_santri' });
db.DetailPelanggaranAsrama.belongsTo(db.Santri, { foreignKey: 'id_santri' });

db.PelanggaranAsrama.hasMany(db.DetailPelanggaranAsrama, { foreignKey: 'id_pelanggaran' });
db.DetailPelanggaranAsrama.belongsTo(db.PelanggaranAsrama, { foreignKey: 'id_pelanggaran' });
// --- AKHIR BAGIAN YANG DIPERBAIKI ---

// Relasi Tahfidz (One-to-Many)
db.Santri.hasMany(db.Tahfidz, { foreignKey: 'id_santri' });
db.Tahfidz.belongsTo(db.Santri, { foreignKey: 'id_santri' });

db.Surah.hasMany(db.Tahfidz, { foreignKey: 'id_surah' });
db.Tahfidz.belongsTo(db.Surah, { foreignKey: 'id_surah' });

// Relasi Absensi Kegiatan
db.Santri.hasMany(db.AbsenKegiatan, { foreignKey: 'id_santri' });
db.AbsenKegiatan.belongsTo(db.Santri, { foreignKey: 'id_santri' });

// Loop ini akan menjalankan semua relasi yang didefinisikan di dalam file model masing-masing
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Menyimpan instance sequelize dan Sequelize constructor ke object db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
