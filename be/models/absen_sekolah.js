// file: models/absen_sekolah.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AbsenSekolah = sequelize.define('AbsenSekolah', {
        id_absen_sekolah: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id_kelas_sekolah: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'kelas_sekolah',
                key: 'id_kelas_sekolah',
            },
        },
        id_jam_pelajaran: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'jam_pelajaran',
                key: 'id_jam_pelajaran',
            },
        },
        id_santri: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'santri',
                key: 'id_santri',
            },
        },
        id_pegawai: { // Guru yang mengabsen
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'pegawai',
                key: 'id_pegawai',
            },
        },
        tanggal: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('Hadir', 'Izin', 'Sakit', 'Alpa'),
            allowNull: false,
        },
    }, {
        tableName: 'absen_sekolah',
        timestamps: true, // createdAt and updatedAt
        
        // --- PENAMBAHAN UNIQUE CONSTRAINT ---
        // Ini akan memberitahu Sequelize untuk membuat kunci unik gabungan
        // dari empat kolom ini di database.
        indexes: [
            {
                unique: true,
                fields: ['id_kelas_sekolah', 'id_jam_pelajaran', 'id_santri', 'tanggal'],
                name: 'unique_absen_sekolah' // Nama constraint (opsional tapi disarankan)
            }
        ]
    });

    return AbsenSekolah;
};