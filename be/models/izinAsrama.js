// file: models/izinAsrama.model.js
module.exports = (sequelize, DataTypes) => {
    const IzinAsrama = sequelize.define('IzinAsrama', {
        id_izin_asrama: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        jenis: { type: DataTypes.ENUM('pulang', 'harian', 'mingguan', 'semester'), allowNull: false },
    }, { tableName: 'izin_asrama', timestamps: false });
    return IzinAsrama;
};