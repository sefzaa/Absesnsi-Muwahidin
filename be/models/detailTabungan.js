// file: models/detailTabungan.model.js
module.exports = (sequelize, DataTypes) => {
    const DetailTabungan = sequelize.define('DetailTabungan', {
        id_detail_tabungan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        jenis: { type: DataTypes.ENUM('debit', 'kredit'), allowNull: false },
        jumlah: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        saldo_akhir: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    }, { tableName: 'detail_tabungan', timestamps: true });
    return DetailTabungan;
};