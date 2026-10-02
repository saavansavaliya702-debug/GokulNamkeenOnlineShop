"use strict";

module.exports = (sequelize, DataTypes) => {
  const NutritionsModel = sequelize.define(
    "NutritionsDatabase",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // one nutrition row per product
        references: {
          model: "AddProductDatabases",
          key: "id",
        },
      },
      energy_kcal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 512,
      },
      protein_g: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 12.4,
      },
      carbohydrates_g: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 48.6,
      },
      total_fat_g: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 29.8,
      },
      saturated_fat_g: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 6.2,
      },
      dietary_fiber_g: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 5.1,
      },
      sodium_mg: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 780,
      },
      sugar_g: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 2.3,
      },
    },
    {
      sequelize,
      modelName: "NutritionsDatabase",
      tableName: "NutritionsDatabase",
      timestamps: true,
    },
  );

  NutritionsModel.associate = (models) => {
    NutritionsModel.belongsTo(models.AddProduct, {
      foreignKey: "product_id",
      as: "product",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  };

  return NutritionsModel;
};