// --- Model untuk Kesehatan ---
// file: models/obat.model.js
module.exports = (sequelize, DataTypes) => {
    const Obat = sequelize.define('Obat', {
        id_obat: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        kode_obat: { type: DataTypes.STRING, unique: true },
        nama_obat: { type: DataTypes.STRING, allowNull: false },
        stok_minimum: { type: DataTypes.INTEGER, defaultValue: 0 },
        stok_sekarang: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, { tableName: 'obat', timestamps: true });
    return Obat;
};