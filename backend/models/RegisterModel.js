"use strict";

module.exports = (sequelize, DataTypes) => {
  const RegisterModel = sequelize.define(
    "Register",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      email: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: true, // added to mirror migration
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false, // consider making this required
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      otp_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_delete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Register",
      tableName: "RegisterDatabases",
      timestamps: true,
      // indexes: [{ fields: ["is_delete"] }],  // remove unless needed
    },
  );

  RegisterModel.associate = (models) => {
    RegisterModel.hasMany(models.Payment, {
      foreignKey: "user_id",
      as: "payment",
    });
  };

  return RegisterModel;
};
