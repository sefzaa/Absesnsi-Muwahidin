// file: models/detailObatMasuk.model.js
module.exports = (sequelize, DataTypes) => {
    const DetailObatMasuk = sequelize.define('DetailObatMasuk', {
        id_detail_obat_masuk: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        jumlah: { type: DataTypes.INTEGER, allowNull: false },
        harga: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    }, { tableName: 'detail_obat_masuk', timestamps: false });
    return DetailObatMasuk;
};