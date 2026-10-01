"use strict";

module.exports = (sequelize, DataTypes) => {
  const CompanyInfo = sequelize.define(
    "CompanyInfo",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Gokul Namkeen",
      },
      founder: { type: DataTypes.STRING, allowNull: true },
      units: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      address_street: { type: DataTypes.STRING, allowNull: true },
      address_city: { type: DataTypes.STRING, allowNull: true },
      address_state: { type: DataTypes.STRING, allowNull: true },

      phones: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      emails: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      website: { type: DataTypes.STRING, allowNull: true },

      facebook: { type: DataTypes.STRING, allowNull: true },
      instagram: { type: DataTypes.STRING, allowNull: true },
      twitter: { type: DataTypes.STRING, allowNull: true },

      tagline: { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT, allowNull: true },

      investors: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      business_partners: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      international_partners: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: "CompanyInfo",
      tableName: "companyinfoDatabase",  // 👈 matches migration
      timestamps: true,
    },
  );

  CompanyInfo.associate = () => {};

  return CompanyInfo;
};