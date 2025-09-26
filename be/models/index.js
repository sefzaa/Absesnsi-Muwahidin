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
// ===         DEFINISI RELASI ANTAR MODEL           ===
// ======================================================

// --- Relasi Akun dan Peran (Users, Roles, Pegawai) ---
db.Role.hasMany(db.User, { foreignKey: 'id_role' });
db.User.belongsTo(db.Role, { foreignKey: 'id_role' });

db.User.hasOne(db.Pegawai, { foreignKey: 'id_user', as: 'pegawai' });
db.Pegawai.belongsTo(db.User, { foreignKey: 'id_user' });


db.User.hasOne(db.Ortu, { foreignKey: 'id_user' });
db.Ortu.belongsTo(db.User, { foreignKey: 'id_user' });


// --- Relasi Pegawai dan Jabatan ---
db.Jabatan.hasMany(db.Pegawai, { foreignKey: 'id_jabatan' });
db.Pegawai.belongsTo(db.Jabatan, { foreignKey: 'id_jabatan' });


// --- Relasi Pegawai dan Absensi (BARU DITAMBAHKAN) ---
db.Pegawai.hasMany(db.AbsenPegawai, { foreignKey: 'id_pegawai' });
db.AbsenPegawai.belongsTo(db.Pegawai, { foreignKey: 'id_pegawai' });

// Relasi untuk mencatat siapa admin yang menginput absensi
db.User.hasMany(db.AbsenPegawai, { foreignKey: 'diinput_oleh' });
db.AbsenPegawai.belongsTo(db.User, { foreignKey: 'diinput_oleh', as: 'admin_input' });


// --- Relasi Santri ---
db.Santri.belongsTo(db.Kelas, { foreignKey: 'id_kelas' });
db.Kelas.hasMany(db.Santri, { foreignKey: 'id_kelas' });

db.Santri.belongsTo(db.Ortu, { foreignKey: 'id_ortu' });
db.Ortu.hasMany(db.Santri, { foreignKey: 'id_ortu' });


// --- Relasi Absensi Kegiatan Santri ---
db.Santri.hasMany(db.AbsenKegiatan, { foreignKey: 'id_santri' });
db.AbsenKegiatan.belongsTo(db.Santri, { foreignKey: 'id_santri' });
db.Kegiatan.hasMany(db.AbsenKegiatan, { foreignKey: 'id_kegiatan' });
db.AbsenKegiatan.belongsTo(db.Kegiatan, { foreignKey: 'id_kegiatan' });






// --- PENAMBAHAN: Relasi Many-to-Many antara Kelas dan Pegawai (Musyrif) ---
db.Kelas.belongsToMany(db.Pegawai, {
  through: db.KelasMusyrif,
  foreignKey: 'id_kelas',
  otherKey: 'id_pegawai',
  as: 'musyrifs' // Alias untuk memanggil data musyrif dari kelas
});

db.Pegawai.belongsToMany(db.Kelas, {
  through: db.KelasMusyrif,
  foreignKey: 'id_pegawai',
  otherKey: 'id_kelas',
  as: 'kelasAsuhan' // Alias untuk memanggil data kelas dari pegawai
});


// --- PENAMBAHAN BARU: Relasi Kelas Sekolah ---
db.KelasSekolah.belongsTo(db.Kelas, { foreignKey: 'id_kelas', as: 'tingkatan' });
db.Kelas.hasMany(db.KelasSekolah, { foreignKey: 'id_kelas' });

// Tambahkan alias agar bisa dipanggil oleh controller
db.Santri.belongsTo(db.KelasSekolah, { foreignKey: 'id_kelas_sekolah', as: 'kelasSekolah' });
db.KelasSekolah.hasMany(db.Santri, { foreignKey: 'id_kelas_sekolah', as: 'santri' });
// -------------------------------------------



// Tambahkan relasi untuk AbsenSekolah
// Relasi AbsenSekolah
db.AbsenSekolah.belongsTo(db.KelasSekolah, { foreignKey: 'id_kelas_sekolah' });
db.KelasSekolah.hasMany(db.AbsenSekolah, { foreignKey: 'id_kelas_sekolah' });

db.AbsenSekolah.belongsTo(db.JamPelajaran, { foreignKey: 'id_jam_pelajaran' });
db.JamPelajaran.hasMany(db.AbsenSekolah, { foreignKey: 'id_jam_pelajaran' });

db.AbsenSekolah.belongsTo(db.Santri, { foreignKey: 'id_santri' });
db.Santri.hasMany(db.AbsenSekolah, { foreignKey: 'id_santri' });

db.AbsenSekolah.belongsTo(db.Pegawai, { foreignKey: 'id_pegawai' });
db.Pegawai.hasMany(db.AbsenSekolah, { foreignKey: 'id_pegawai' });



// --- Relasi Baru untuk Absensi Guru ---
db.AbsenGuru.belongsTo(db.Pegawai, { foreignKey: 'id_pegawai' });
db.Pegawai.hasMany(db.AbsenGuru, { foreignKey: 'id_pegawai' });

db.AbsenGuru.belongsTo(db.JamPelajaran, { foreignKey: 'id_jam_pelajaran' });
db.JamPelajaran.hasMany(db.AbsenGuru, { foreignKey: 'id_jam_pelajaran' });

db.AbsenGuru.belongsTo(db.AbsenSekolah, { foreignKey: 'id_absen_sekolah' });
db.AbsenSekolah.hasMany(db.AbsenGuru, { foreignKey: 'id_absen_sekolah' });


// --- ▼▼▼ PENAMBAHAN BARU: Relasi Absen Musyrif (Otomatis) ▼▼▼ ---
db.AbsenMusyrif.belongsTo(db.Pegawai, { foreignKey: 'id_pegawai' });
db.Pegawai.hasMany(db.AbsenMusyrif, { foreignKey: 'id_pegawai' });
// --- ▲▲▲ AKHIR PENAMBAHAN BARU ---




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