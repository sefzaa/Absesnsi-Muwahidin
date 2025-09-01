// file: models/surah.js
module.exports = (sequelize, DataTypes) => {
    const Surah = sequelize.define('Surah', {
        id_surah: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama: { type: DataTypes.STRING, allowNull: false, unique: true },
    }, { tableName: 'surah', timestamps: false });
    return Surah;
};