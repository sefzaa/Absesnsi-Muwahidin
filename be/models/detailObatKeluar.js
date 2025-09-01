// file: models/detailObatKeluar.model.js
module.exports = (sequelize, DataTypes) => {
    const DetailObatKeluar = sequelize.define('DetailObatKeluar', {
        id_detail_obat_keluar: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        jumlah: { type: DataTypes.INTEGER, allowNull: false },
        tanggal: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, { tableName: 'detail_obat_keluar', timestamps: false });
    return DetailObatKeluar;
};