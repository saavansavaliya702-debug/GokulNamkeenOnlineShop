"use strict";

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define(
    "Order",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "RegisterDatabases", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      full_name:      { type: DataTypes.STRING, allowNull: true },
      email:          { type: DataTypes.STRING, allowNull: true },
      phone:          { type: DataTypes.STRING(20), allowNull: true },
      address:        { type: DataTypes.STRING, allowNull: true },
      city:           { type: DataTypes.STRING, allowNull: true },
      state:          { type: DataTypes.STRING, allowNull: true },
      pincode:        { type: DataTypes.STRING(10), allowNull: true },
      items:          { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
      subtotal:       { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      shipping:       { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      tax:            { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      total:          { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
      payment_mode:   { type: DataTypes.STRING(30), allowNull: true, defaultValue: "cod" },
      payment_id:     { type: DataTypes.STRING(100), allowNull: true },
      payment_status: { type: DataTypes.STRING(30), allowNull: true, defaultValue: "pending" },
      order_status:   { type: DataTypes.STRING(30), allowNull: true, defaultValue: "pending" },
      is_delete:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
      sequelize,
      modelName: "Order",
      tableName: "paymentDatabases",
      timestamps: true,
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    }
  );

  Order.associate = (models) => {
    if (models.Register) {
      Order.belongsTo(models.Register, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  };

  return Order;
};