module.exports = (sequelize, DataTypes) => {
    const AbsenMusyrif = sequelize.define('AbsenMusyrif', {
        id_absen_musyrif: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        id_pegawai: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        id_kegiatan_unik: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        nama_kegiatan: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        tanggal: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Hadir'),
            allowNull: false,
            defaultValue: 'Hadir'
        }
    }, {
        tableName: 'absen_musyrif',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['id_pegawai', 'id_kegiatan_unik', 'tanggal'],
                name: 'unique_absen_musyrif_constraint'
            }
        ]
    });

    AbsenMusyrif.associate = (models) => {
        // Relasi di level aplikasi tetap ada dan berfungsi
        AbsenMusyrif.belongsTo(models.Pegawai, { foreignKey: 'id_pegawai' });
    };

    return AbsenMusyrif;
};

