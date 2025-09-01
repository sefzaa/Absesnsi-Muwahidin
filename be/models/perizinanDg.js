// --- Model untuk Perizinan ---
// file: models/perizinanDg.model.js
module.exports = (sequelize, DataTypes) => {
    const PerizinanDG = sequelize.define('PerizinanDG', {
        id_perizinan: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        jenis: { type: DataTypes.ENUM('sakit', 'pulang', 'izin'), allowNull: false },
    }, { tableName: 'perizinan_dg', timestamps: false });
    return PerizinanDG;
};