// file: models/kamar.js
module.exports = (sequelize, DataTypes) => {
    const KelasSekolah = sequelize.define('KelasSekolah', {
        id_kelas_sekolah: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        kelas: { type: DataTypes.STRING, allowNull: false },
        kapasitas: { type: DataTypes.INTEGER, allowNull: false },
        // ▼▼▼ TAMBAHKAN BARIS INI ▼▼▼
        keterangan_kelas: { type: DataTypes.STRING, allowNull: true, defaultValue: null }
    }, { tableName: 'kelas_sekolah', timestamps: false });
    return KelasSekolah;
};