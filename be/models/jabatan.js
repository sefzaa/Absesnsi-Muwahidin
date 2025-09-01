module.exports = (sequelize, DataTypes) => {
    const Jabatan = sequelize.define('Jabatan', {
        id_jabatan: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        nama_jabatan: { 
            type: DataTypes.STRING(50), 
            allowNull: false,
            unique: true
        },
        deskripsi: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
    }, { 
        tableName: 'jabatan',
        timestamps: true 
    });

    return Jabatan;
};