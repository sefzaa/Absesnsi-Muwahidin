// file: models/user.model.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        id_user: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama: { type: DataTypes.STRING, allowNull: false },
        username: { type: DataTypes.STRING, allowNull: false, unique: true },
        email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
        password: { type: DataTypes.STRING, allowNull: false },
        jenis_kelamin: { type: DataTypes.ENUM('Putra', 'Putri'), allowNull: true },
    }, { tableName: 'users', timestamps: true });
    return User;
};