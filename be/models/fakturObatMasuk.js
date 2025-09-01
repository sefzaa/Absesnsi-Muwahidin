// file: models/fakturObatMasuk.model.js
module.exports = (sequelize, DataTypes) => {
    const FakturObatMasuk = sequelize.define('FakturObatMasuk', {
        id_faktur_obat_masuk: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        no_faktur: { type: DataTypes.STRING, unique: true },
        tanggal_masuk: { type: DataTypes.DATEONLY, allowNull: false },
        image: { type: DataTypes.STRING },
        total: { type: DataTypes.DECIMAL(10, 2) },
    }, { tableName: 'faktur_obat_masuk', timestamps: true });
    return FakturObatMasuk;
};