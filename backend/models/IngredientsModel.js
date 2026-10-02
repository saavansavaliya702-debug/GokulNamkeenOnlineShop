"use strict";

module.exports = (sequelize, DataTypes) => {
  const IngredientsModel = sequelize.define(
    "IngredientsDatabase",
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
      name: {
        type: DataTypes.STRING,
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
      modelName: "IngredientsDatabase",
      tableName: "IngredientsDatabase",
      timestamps: true,
    },
  );

  IngredientsModel.associate = (models) => {
    IngredientsModel.belongsTo(models.AddProduct, {
      foreignKey: "product_id",
      as: "product",
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    });
  };

  return IngredientsModel;
};