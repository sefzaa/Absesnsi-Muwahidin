// file: models/detailUkt.model.js
module.exports = (sequelize, DataTypes) => {
    const DetailUkt = sequelize.define('DetailUkt', {
        id_detail_ukt: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        tanggal: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        createdby: { type: DataTypes.STRING },
        via: { type: DataTypes.STRING },
    }, { tableName: 'detail_ukt', timestamps: false });
    return DetailUkt;
};