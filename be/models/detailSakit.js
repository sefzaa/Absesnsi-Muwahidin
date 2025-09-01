// file: models/detailSakit.model.js
module.exports = (sequelize, DataTypes) => {
    const DetailSakit = sequelize.define('DetailSakit', {
        id_detail_sakit: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        keterangan_wk: { type: DataTypes.TEXT },
        tanggal: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        penanganan: { type: DataTypes.TEXT },
        isApprove_Pol: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { tableName: 'detail_sakit', timestamps: true });
    return DetailSakit;
};