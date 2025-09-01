// --- Model untuk Kegiatan & Tahfidz ---
// file: models/kegiatan.js
module.exports = (sequelize, DataTypes) => {
    const Kegiatan = sequelize.define('Kegiatan', {
        id_kegiatan: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        nama: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        jenis: { 
            // PERUBAHAN: Menambahkan 'tambahan-putra' dan 'tambahan-putri' agar sesuai dengan database
            type: DataTypes.ENUM('tambahan-putra', 'tambahan-putri'),
            allowNull: true 
        },
        tanggal: { 
            type: DataTypes.DATE, 
            allowNull: false 
        },
    }, { 
        tableName: 'kegiatan', 
        timestamps: false 
    });

    return Kegiatan;
};