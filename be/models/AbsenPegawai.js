module.exports = (sequelize, DataTypes) => {
    const AbsenPegawai = sequelize.define('AbsenPegawai', {
        // Kolom Primary Key
        id_absensi: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true, 
            allowNull: false 
        },

        // Kolom Foreign Key
        id_pegawai: { 
            type: DataTypes.STRING(50), 
            allowNull: false 
        },
        diinput_oleh: { 
            type: DataTypes.INTEGER, // UBAH MENJADI INTEGER
            allowNull: false 
        },

        // Kolom Data Absensi
        tanggal: { 
            type: DataTypes.DATEONLY, 
            allowNull: false 
        },
        status: { 
            type: DataTypes.ENUM('Hadir', 'Sakit', 'Izin', 'Alpa'), 
            allowNull: false 
        }, // Ini adalah kolom status kehadiran yang Anda maksud
        jam_masuk: { 
            type: DataTypes.TIME, 
            allowNull: true 
        },
        jam_keluar: { 
            type: DataTypes.TIME, 
            allowNull: true 
        },
        status_jam_masuk: { 
            type: DataTypes.ENUM('On Time', 'Terlambat'), 
            allowNull: true 
        },
        keterangan: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },

    }, { 
        tableName: 'absen_pegawai', // Nama tabel baru
        timestamps: true // Tetap menggunakan createdAt dan updatedAt
    });

    return AbsenPegawai;
};