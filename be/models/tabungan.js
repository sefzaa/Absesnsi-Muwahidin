// --- Model untuk Keuangan ---
// file: models/tabungan.model.js
module.exports = (sequelize, DataTypes) => {
    const Tabungan = sequelize.define('Tabungan', {
        id_tabungan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        saldo: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    }, { tableName: 'tabungan', timestamps: true });
    return Tabungan;
};