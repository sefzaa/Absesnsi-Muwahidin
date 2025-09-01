module.exports = (sequelize, DataTypes) => {
    const DetailIzinAsrama = sequelize.define('DetailIzinAsrama', {
        id_detail_izin_asrama: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        tanggal_awal: { 
            type: DataTypes.DATE, 
            allowNull: false 
        },
        tanggal_akhir: { 
            type: DataTypes.DATE, 
            allowNull: false 
        },
        jam_keluar: { 
            type: DataTypes.TIME 
        },
        jam_masuk: { // Ini adalah jam RENCANA kembali
            type: DataTypes.TIME 
        },
        // KOLOM BARU DITAMBAHKAN DI SINI
        jam_kembali_aktual: {
            type: DataTypes.TIME,
            allowNull: true // Boleh kosong jika santri belum kembali
        },
        isApprove_wk: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: false 
        },
        keterangan: { 
            type: DataTypes.TEXT 
        },
        status: {
            type: DataTypes.ENUM('Diajukan', 'Disetujui Disgiat', 'Disetujui WK', 'Pulang', 'Selesai', 'Terlambat'),
            defaultValue: 'Diajukan'
        },
        pamong: {
            type: DataTypes.STRING,
            allowNull: true
        },
        nama_pamong: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, { 
        tableName: 'detail_izin_asrama', 
        timestamps: true 
    });

    DetailIzinAsrama.associate = models => {
        DetailIzinAsrama.belongsTo(models.Santri, { foreignKey: 'id_santri' });
        DetailIzinAsrama.belongsTo(models.IzinAsrama, { foreignKey: 'id_izin_asrama' });
    };

    return DetailIzinAsrama;
};
