// file: models/hafalan.model.js
module.exports = (sequelize, DataTypes) => {
    const Hafalan = sequelize.define('Hafalan', {
        id_hafalan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama: { type: DataTypes.STRING, allowNull: false },
        keterangan: { type: DataTypes.TEXT },
        tanggal: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    }, { tableName: 'hafalan', timestamps: true });
    return Hafalan;
};