module.exports = (sequelize, DataTypes) => {
    const KelasMusyrif = sequelize.define('KelasMusyrif', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_kelas: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_pegawai: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    }, {
        tableName: 'kelas_musyrif',
        timestamps: true
    });
    return KelasMusyrif;
};