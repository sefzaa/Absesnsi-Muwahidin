// file: models/index.js

const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Import koneksi sequelize dari config
const fs = require('fs');
const path = require('path');

const db = {};

// --- FUNGSI REKURSIF UNTUK MEMUAT MODEL DARI SUB-FOLDER ---
const loadModels = (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.lstatSync(fullPath);

    if (stat.isDirectory()) {
      // Jika ini adalah direktori, panggil fungsi ini lagi untuk direktori tersebut
      loadModels(fullPath);
    } else if (file.slice(-9) === '.model.js') {
      // Jika ini adalah file model, import dan tambahkan ke object `db`
      const model = require(fullPath)(sequelize, DataTypes);
      db[model.name] = model;
      console.log(`Model '${model.name}' berhasil dimuat dari ${file}`);
    }
  }
};

// Mulai memuat model dari direktori saat ini (__dirname)
loadModels(__dirname);


// --- DEFINISIKAN SEMUA RELASI ANTAR TABEL DI SINI ---
// Pastikan semua model sudah dimuat sebelum mendefinisikan asosiasi
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Contoh mendefinisikan relasi langsung di sini (jika Anda lebih suka cara ini)
// Pastikan semua model sudah dimuat oleh fungsi rekursif di atas

// Relasi User dan Role (Many-to-Many)
const UserRoles = sequelize.define('user_roles', {}, { timestamps: false });
db.User.belongsToMany(db.Role, { through: UserRoles, foreignKey: 'id_user' });
db.Role.belongsToMany(db.User, { through: UserRoles, foreignKey: 'id_role' });

// Relasi User ke entitas lain
db.User.hasOne(db.WaliKamar, { foreignKey: 'id_user' });
db.WaliKamar.belongsTo(db.User, { foreignKey: 'id_user' });

db.User.hasOne(db.Ortu, { foreignKey: 'id_user' });
db.Ortu.belongsTo(db.User, { foreignKey: 'id_user' });

// Relasi Santri
db.Kelas.hasMany(db.Santri, { foreignKey: 'id_kelas' });
db.Santri.belongsTo(db.Kelas, { foreignKey: 'id_kelas' });

db.Ortu.hasMany(db.Santri, { foreignKey: 'id_ortu' });
db.Santri.belongsTo(db.Ortu, { foreignKey: 'id_ortu' });

// Relasi Asrama & Kamar
db.Asrama.hasMany(db.Kamar, { foreignKey: 'id_asrama' });
db.Kamar.belongsTo(db.Asrama, { foreignKey: 'id_asrama' });

db.WaliKamar.hasMany(db.Kamar, { foreignKey: 'id_wali_kamar' });
db.Kamar.belongsTo(db.WaliKamar, { foreignKey: 'id_wali_kamar' });

// Relasi Kamar & Santri (Many-to-Many melalui DetailKamar)
db.Kamar.belongsToMany(db.Santri, { through: db.DetailKamar, foreignKey: 'id_kamar' });
db.Santri.belongsToMany(db.Kamar, { through: db.DetailKamar, foreignKey: 'id_santri' });

// ... (semua definisi relasi lainnya tetap sama seperti sebelumnya) ...
// Relasi Prestasi
db.Santri.hasMany(db.Prestasi, { foreignKey: 'id_santri' });
db.Prestasi.belongsTo(db.Santri, { foreignKey: 'id_santri' });

// Relasi Pelanggaran DG (Many-to-Many)
db.PelanggaranDG.belongsToMany(db.Santri, { through: db.DetailPelanggaranDG, foreignKey: 'id_pelanggaran' });
db.Santri.belongsToMany(db.PelanggaranDG, { through: db.DetailPelanggaranDG, foreignKey: 'id_santri' });

// Relasi Pelanggaran Asrama (Many-to-Many)
db.PelanggaranAsrama.belongsToMany(db.Santri, { through: db.DetailPelanggaranAsrama, foreignKey: 'id_pelanggaran' });
db.Santri.belongsToMany(db.PelanggaranAsrama, { through: db.DetailPelanggaranAsrama, foreignKey: 'id_santri' });

// Relasi Perizinan DG (Many-to-Many)
db.PerizinanDG.belongsToMany(db.Santri, { through: db.DetailPerizinanDG, foreignKey: 'id_perizinan' });
db.Santri.belongsToMany(db.PerizinanDG, { through: db.DetailPerizinanDG, foreignKey: 'id_santri' });

// Relasi Izin Asrama (Many-to-Many)
db.IzinAsrama.belongsToMany(db.Santri, { through: db.DetailIzinAsrama, foreignKey: 'id_izin_asrama' });
db.Santri.belongsToMany(db.IzinAsrama, { through: db.DetailIzinAsrama, foreignKey: 'id_santri' });

// Relasi Kesehatan
db.Santri.hasMany(db.DetailSakit, { foreignKey: 'id_santri' });
db.DetailSakit.belongsTo(db.Santri, { foreignKey: 'id_santri' });

// Relasi Obat
db.FakturObatMasuk.belongsToMany(db.Obat, { through: db.DetailObatMasuk, foreignKey: 'id_faktur_obat_masuk' });
db.Obat.belongsToMany(db.FakturObatMasuk, { through: db.DetailObatMasuk, foreignKey: 'id_obat' });

db.Obat.hasMany(db.DetailObatKeluar, { foreignKey: 'id_obat' });
db.DetailObatKeluar.belongsTo(db.Obat, { foreignKey: 'id_obat' });

// Relasi Keuangan
db.Santri.hasOne(db.Tabungan, { foreignKey: 'id_santri' });
db.Tabungan.belongsTo(db.Santri, { foreignKey: 'id_santri' });

db.Tabungan.hasMany(db.DetailTabungan, { foreignKey: 'id_tabungan' });
db.DetailTabungan.belongsTo(db.Tabungan, { foreignKey: 'id_tabungan' });

db.Santri.hasMany(db.Ukt, { foreignKey: 'id_santri' });
db.Ukt.belongsTo(db.Santri, { foreignKey: 'id_santri' });

db.Ukt.hasMany(db.DetailUkt, { foreignKey: 'id_ukt' });
db.DetailUkt.belongsTo(db.Ukt, { foreignKey: 'id_ukt' });

// Relasi Kegiatan & Tahfidz
db.Santri.belongsToMany(db.Kegiatan, { through: db.AbsenKegiatan, foreignKey: 'id_santri' });
db.Kegiatan.belongsToMany(db.Santri, { through: db.AbsenKegiatan, foreignKey: 'id_kegiatan' });

db.Santri.hasMany(db.Hafalan, { foreignKey: 'id_santri' });
db.Hafalan.belongsTo(db.Santri, { foreignKey: 'id_santri' });

// Relasi Tahfidz (Many-to-Many Santri & Surah)
db.Santri.belongsToMany(db.Surah, { through: db.Tahfidz, foreignKey: 'id_santri' });
db.Surah.belongsToMany(db.Santri, { through: db.Tahfidz, foreignKey: 'id_surah' });


// Menyimpan instance sequelize dan Sequelize constructor ke object db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
