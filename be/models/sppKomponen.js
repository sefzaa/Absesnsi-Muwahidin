// models/sppKomponen.js
module.exports = (sequelize, DataTypes) => {
  const SppKomponen = sequelize.define('SppKomponen', {
    // Di database, Sequelize akan membuat tabel bernama 'SppKomponens'
    // Anda bisa menggantinya jika mau dengan properti tableName
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nama komponen SPP, contoh: Uang Pembangunan',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2), // Menggunakan DECIMAL lebih aman untuk data keuangan
      allowNull: false,
      comment: 'Jumlah biaya komponen SPP',
    },
  }, {
    // Jika Anda ingin nama tabelnya persis 'spp_komponen', tambahkan baris ini
    tableName: 'spp_komponen',
    timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
  });

  return SppKomponen;
};
