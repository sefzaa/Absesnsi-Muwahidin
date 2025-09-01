// file: models/ortu.model.js
module.exports = (sequelize, DataTypes) => {
    const Ortu = sequelize.define('Ortu', {
        id_ortu: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama_ortu_lk: { type: DataTypes.STRING },
        nama_ortu_pr: { type: DataTypes.STRING }, // Koreksi dari nama_orru_pr
        pekerjaan_lk: { type: DataTypes.STRING },
        pekerjaan_pr: { type: DataTypes.STRING },
        no_telp: { type: DataTypes.STRING },
        alamat: { type: DataTypes.TEXT },
    }, { tableName: 'ortu', timestamps: true });
    return Ortu;
};