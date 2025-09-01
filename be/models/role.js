// file: models/role.model.js
module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        id_role: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nama_role: { type: DataTypes.STRING, allowNull: false },
        slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    }, { tableName: 'roles', timestamps: true });
    return Role;
};