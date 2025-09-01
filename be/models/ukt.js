// file: models/ukt.model.js
module.exports = (sequelize, DataTypes) => {
    const Ukt = sequelize.define('Ukt', {
        id_ukt: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        bulan: { type: DataTypes.STRING, allowNull: false },
        tahun: { type: DataTypes.STRING(4), allowNull: false },
        jumlah: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        status: { type: DataTypes.ENUM('Lunas', 'Belum Lunas'), defaultValue: 'Belum Lunas' },
    }, { tableName: 'ukt', timestamps: true });
    return Ukt;
};