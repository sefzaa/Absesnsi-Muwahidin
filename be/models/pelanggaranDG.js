// --- Model untuk Pelanggaran ---
// file: models/pelanggaranDg.model.js
module.exports = (sequelize, DataTypes) => {
    const PelanggaranDG = sequelize.define('PelanggaranDG', {
        id_pelanggaran: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama: { type: DataTypes.STRING, allowNull: false },
        jenis: { type: DataTypes.STRING },
        bobot: { type: DataTypes.INTEGER },
    }, { tableName: 'pelanggaran_dg', timestamps: false });
    return PelanggaranDG;
};