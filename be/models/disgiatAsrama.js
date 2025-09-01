// file: models/disgiatAsrama.js
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
    const DisgiatAsrama = sequelize.define('DisgiatAsrama', {
        // PERUBAHAN: Nama primary key diubah
        id_disgiat_asrama: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true 
        },
        nama: { 
            type: DataTypes.STRING, 
            allowNull: false 
        },
        jenis_kelamin: {
            type: DataTypes.ENUM('Putra', 'Putri'),
            allowNull: false
        },
        no_telp: { 
            type: DataTypes.STRING 
        },
        avatar: { 
            type: DataTypes.STRING 
        },
        id_user: {
            type: DataTypes.INTEGER
        }
    }, { 
        // PERUBAHAN: Nama tabel diubah
        tableName: 'disgiat_asrama',
        timestamps: true 
    });

    return DisgiatAsrama;
};