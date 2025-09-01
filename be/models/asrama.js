// file: models/asrama.js
module.exports = (sequelize, DataTypes) => {
    const Asrama = sequelize.define('Asrama', {
        id_asrama: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nama_gedung: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // KOLOM BARU: Menentukan jenis asrama (Putra/Putri)
        jenis: {
            type: DataTypes.ENUM('Putra', 'Putri'),
            allowNull: false,
            comment: 'Jenis asrama untuk santri putra atau putri'
        },
        penanggung_jawab: {
            type: DataTypes.STRING
        },
    }, {
        tableName: 'asrama',
        timestamps: false
    });

    
    return Asrama;
};
