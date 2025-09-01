// file: models/tahfidz.js
module.exports = (sequelize, DataTypes) => {
    const Tahfidz = sequelize.define('Tahfidz', {
        id_tahfidz: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ayat: { type: DataTypes.STRING, allowNull: false },
        tanggal: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    }, { tableName: 'tahfidz', timestamps: true });
    return Tahfidz;
};
