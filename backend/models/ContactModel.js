"use strict";

module.exports = (sequelize, DataTypes) => {
  const ContactModel = sequelize.define(
    "Contact",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: { allowNull: false, type: DataTypes.STRING },
      email: {
        allowNull: false,
        type: DataTypes.STRING,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subject: { type: DataTypes.STRING, allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: false },
      is_delete: {                       // ✅ add it back
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Contact",
      tableName: "ContactDatabases",
      timestamps: true,
      indexes: [
        { fields: ["is_delete"] },       
        { fields: ["email"] },
      ],
    }
  );

  ContactModel.associate = () => {};

  return ContactModel;
};