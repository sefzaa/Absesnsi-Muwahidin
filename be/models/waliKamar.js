// file: models/waliKamar.js
module.exports = (sequelize, DataTypes) => {
    const WaliKamar = sequelize.define('WaliKamar', {
        id_wali_kamar: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama: { type: DataTypes.STRING, allowNull: false },
        // KOLOM BARU DITAMBAHKAN
        jenis_kelamin: {
            type: DataTypes.ENUM('Putra', 'Putri'),
            allowNull: false
        },
        tempat_lahir: { type: DataTypes.STRING },
        tanggal_lahir: { type: DataTypes.DATE },
        alamat: { type: DataTypes.TEXT },
        tahun_masuk: { type: DataTypes.STRING(4) },
        no_telp: { type: DataTypes.STRING },
        avatar: { type: DataTypes.STRING },
        id_user: { type: DataTypes.INTEGER }
    }, { 
        tableName: 'wali_kamar', 
        timestamps: true 
    });
    return WaliKamar;
};