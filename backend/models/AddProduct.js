"use strict";

module.exports = (sequelize, DataTypes) => {
  const AddProductModel = sequelize.define(
    "AddProduct",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      price: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      // ⭐ NEW: low-stock alert threshold
      low_stock_alert: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },

      category: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      weight: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      weightUnit: {
        type: DataTypes.ENUM("g", "kg", "ml", "l", "pcs"),
        allowNull: false,
        defaultValue: "g",
      },
      pcs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      variants: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      is_delete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "AddProduct",
      tableName: "AddProductDatabases",
      timestamps: true,
      indexes: [{ fields: ["is_delete"] }],
    },
  );

  AddProductModel.associate = () => {};

  return AddProductModel;
};