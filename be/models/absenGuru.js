// file: models/absenGuru.js

module.exports = (sequelize, DataTypes) => {
    const AbsenGuru = sequelize.define('AbsenGuru', {
        id_absen_guru: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        id_pegawai: {
            type: DataTypes.STRING(50),
            allowNull: false,
            references: {
                model: 'pegawai', // nama tabel
                key: 'id_pegawai'
            }
        },
        id_jam_pelajaran: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'jam_pelajaran', // nama tabel
                key: 'id_jam_pelajaran'
            }
        },
        tanggal: {
            type: DataTypes.DATEONLY, // Hanya menyimpan tanggal tanpa waktu
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('Hadir'),
            allowNull: false,
            defaultValue: 'Hadir'
        },
        // Opsional: untuk melacak absensi ini dibuat dari input absensi santri yang mana
        id_absen_sekolah: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'absen_sekolah', // nama tabel
                key: 'id_absen_sekolah'
            }
        }
    }, {
        tableName: 'absen_guru',
        timestamps: true, // createdAt dan updatedAt
    });

    AbsenGuru.associate = (models) => {
        AbsenGuru.belongsTo(models.Pegawai, { foreignKey: 'id_pegawai' });
        AbsenGuru.belongsTo(models.JamPelajaran, { foreignKey: 'id_jam_pelajaran' });
        AbsenGuru.belongsTo(models.AbsenSekolah, { foreignKey: 'id_absen_sekolah' });
    };

    return AbsenGuru;
};