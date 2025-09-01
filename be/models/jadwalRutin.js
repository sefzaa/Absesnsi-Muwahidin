// models/jadwalRutin.js

module.exports = (sequelize, DataTypes) => {
    const JadwalRutin = sequelize.define('JadwalRutin', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'id_jadwal_rutin'
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            comment: 'Nama kegiatan rutin, contoh: Shalat Subuh.'
        },
        // --- KOLOM BARU DITAMBAHKAN DI SINI ---
        jenis: {
            type: DataTypes.ENUM('Putra', 'Putri'),
            allowNull: false,
            comment: 'Kategori jadwal untuk putra atau putri'
        },
        // -----------------------------------------
        repetitionType: {
            type: DataTypes.ENUM('harian', 'mingguan', 'bulanan'),
            allowNull: false,
            comment: 'Jenis pengulangan jadwal.'
        },
        time: {
            type: DataTypes.TIME,
            allowNull: true,
            comment: 'Waktu pelaksanaan, terutama untuk jenis harian.'
        },
        days: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Hari pelaksanaan untuk jenis mingguan.'
        },
        dates: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: 'Tanggal pelaksanaan untuk jenis bulanan.'
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'FiClipboard'
        },
        iconBg: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'bg-gray-100'
        },
        iconColor: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'text-gray-600'
        }
    }, {
        tableName: 'jadwal_rutin',
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    });

    return JadwalRutin;
};