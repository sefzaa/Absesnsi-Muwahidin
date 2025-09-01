// file: models/detailPerizinanDg.model.js
module.exports = (sequelize, DataTypes) => {
    const DetailPerizinanDG = sequelize.define('DetailPerizinanDG', {
        id_detail_perizinan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tanggal_awal: { type: DataTypes.DATE, allowNull: false },
        tanggal_akhir: { type: DataTypes.DATE, allowNull: false },
        isApprove_Pol: { type: DataTypes.BOOLEAN, defaultValue: false },
        isApprove_Asr: { type: DataTypes.BOOLEAN, defaultValue: false },
        isApprove_Skl: { type: DataTypes.BOOLEAN, defaultValue: false },
        keterangan: { type: DataTypes.TEXT },
    }, { tableName: 'detail_perizinan_dg', timestamps: true });
    return DetailPerizinanDG;
};