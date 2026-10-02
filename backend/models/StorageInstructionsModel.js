"use strict";

module.exports = (sequelize, DataTypes) => {
  const StorageInstructionsModel = sequelize.define(
    "StorageInstructionsDatabase",
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
        references: {
          model: "AddProductDatabases",
          key: "id",
        },
      },
      icon: {
        type: DataTypes.STRING, // '🌡️', '🔒', '🥄', '⏳'
        allowNull: true,
      },
      title: {
        type: DataTypes.STRING, // 'Cool & Dry', etc.
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: "StorageInstructionsDatabase",
      tableName: "StorageInstructionsDatabase",
      timestamps: true,
    },
  );

  StorageInstructionsModel.associate = (models) => {
    StorageInstructionsModel.belongsTo(models.AddProduct, {
      foreignKey: "product_id",
      as: "product",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  };

  return StorageInstructionsModel;
};