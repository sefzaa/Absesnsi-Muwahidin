// file: models/detailPelanggaranAsrama.js
module.exports = (sequelize, DataTypes) => {
    const DetailPelanggaranAsrama = sequelize.define('DetailPelanggaranAsrama', {
        id_detail_pelanggaran: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tanggal: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        pembinaan: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.STRING },
        keterangan: { type: DataTypes.TEXT, allowNull: true },
    }, { tableName: 'detail_pelanggaran_asrama', timestamps: true });


    return DetailPelanggaranAsrama;
};
