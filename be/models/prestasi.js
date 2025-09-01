// file: models/prestasi.js
module.exports = (sequelize, DataTypes) => {
    const Prestasi = sequelize.define('Prestasi', {
        id_prestasi: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        prestasi: { type: DataTypes.TEXT, allowNull: false },
        // ▼▼▼ TAMBAHKAN KOLOM INI ▼▼▼
        keterangan: { type: DataTypes.TEXT, allowNull: true },
        tanggal: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
    }, { tableName: 'prestasi', timestamps: true });
    return Prestasi;
};
