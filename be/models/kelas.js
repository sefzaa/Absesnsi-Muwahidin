// file: models/kelas.model.js
module.exports = (sequelize, DataTypes) => {
    const Kelas = sequelize.define('Kelas', {
        id_kelas: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama_kelas: { type: DataTypes.STRING, allowNull: false, unique: true },
    }, { tableName: 'kelas', timestamps: false });
    return Kelas;
};
