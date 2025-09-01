module.exports = (sequelize, DataTypes) => {
    const Pegawai = sequelize.define('Pegawai', {
        id_pegawai: { 
            type: DataTypes.STRING(50), 
            primaryKey: true, 
            allowNull: false 
        },
        id_jabatan: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        id_user: { 
            type: DataTypes.INTEGER,
            allowNull: true
        },
        nama: { 
            type: DataTypes.STRING(50), 
            allowNull: false 
        },
        nip: { 
            type: DataTypes.STRING(50), 
            allowNull: true, // PERUBAHAN: Diizinkan null sesuai permintaan
            unique: true 
        },
        jenis_kelamin: { 
            // PERUBAHAN: Disesuaikan dengan ENUM di database tabel 'pegawai'
            type: DataTypes.ENUM('Laki-laki', 'Perempuan'), 
            allowNull: false 
        },
        tempat_lahir: { 
            type: DataTypes.STRING(50), 
            allowNull: true 
        },
        tanggal_lahir: { 
            type: DataTypes.DATEONLY, 
            allowNull: true 
        },
        alamat: { 
            type: DataTypes.TEXT, 
            allowNull: true 
        },
        no_telp: { 
            type: DataTypes.STRING(20), 
            allowNull: true 
        },
        tahun_masuk: { 
            type: DataTypes.STRING(4), 
            allowNull: true 
        },
    }, { 
        tableName: 'pegawai',
        timestamps: true
    });

    return Pegawai;
};
