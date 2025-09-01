// file: models/detailPelanggaranDg.model.js
module.exports = (sequelize, DataTypes) => {
    const DetailPelanggaranDG = sequelize.define('DetailPelanggaranDG', {
        id_detail_pelanggaran: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tanggal: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        pembinaan: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.STRING },
    }, { tableName: 'detail_pelanggaran_dg', timestamps: true });
    return DetailPelanggaranDG;
};