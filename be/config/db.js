// file: config/db.js

// Menggunakan pustaka 'dotenv' untuk memuat variabel lingkungan dari file .env
require('dotenv').config(); 
const { Sequelize } = require('sequelize');

// Membuat instance Sequelize untuk koneksi database
// Konfigurasi diambil dari variabel lingkungan untuk keamanan
const sequelize = new Sequelize(
  process.env.DB_NAME,    // Nama database
  process.env.DB_USER,    // User database
  process.env.DB_PASS,    // Password database
  {
    host: process.env.DB_HOST, // Host database
    dialect: 'mysql',          // Menentukan bahwa kita menggunakan MySQL
    logging: false,            // Menonaktifkan logging query SQL di konsol

  }
);

// Mengekspor instance sequelize untuk digunakan di file lain
module.exports = sequelize;
