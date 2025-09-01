// file: models/pelanggaranAsrama.js
module.exports = (sequelize, DataTypes) => {
    const PelanggaranAsrama = sequelize.define('PelanggaranAsrama', {
        id_pelanggaran: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        nama: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        // --- KOLOM BARU DITAMBAHKAN DI SINI ---
        kategori: {
            type: DataTypes.ENUM('Putra', 'Putri'),
            allowNull: false,
            comment: 'Kategori pelanggaran untuk putra atau putri'
        },
        // ------------------------------------
        jenis: { 
            type: DataTypes.STRING 
        },
        bobot: { 
            type: DataTypes.INTEGER 
        },
    }, { 
        tableName: 'pelanggaran_asrama', 
        timestamps: false 
    });
    return PelanggaranAsrama;
};