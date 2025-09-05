'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JamPelajaran extends Model {
    static associate(models) {
      // Tidak ada asosiasi yang perlu didefinisikan untuk saat ini
    }
  }
  JamPelajaran.init({
    id_jam_pelajaran: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nama_jam: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    jam_mulai: {
      type: DataTypes.TIME,
      allowNull: false
    },
    jam_selesai: {
      type: DataTypes.TIME,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'JamPelajaran',
    tableName: 'jam_pelajaran', // Pastikan nama tabel sesuai
    timestamps: true // Otomatis menangani createdAt dan updatedAt
  });
  return JamPelajaran;
};