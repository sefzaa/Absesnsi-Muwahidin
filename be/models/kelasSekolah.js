module.exports = (sequelize, DataTypes) => {
    // Nama model harus KelasSekolah
    const KelasSekolah = sequelize.define('KelasSekolah', {
        id_kelas_sekolah: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        nama_kelas_sekolah: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        },
        // Foreign key id_kelas WAJIB ada di sini
        id_kelas: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        jenis_kelamin: {
            type: DataTypes.ENUM('Putra', 'Putri'),
            allowNull: false
        },
        kapasitas: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, { 
        tableName: 'kelas_sekolah',
        timestamps: true // Ubah menjadi true
    });

  
    return KelasSekolah; // Kembalikan variabel yang benar
};