"use strict";

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "RegisterDatabases", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      full_name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      address: { type: DataTypes.STRING, allowNull: false },
      city: { type: DataTypes.STRING, allowNull: false },
      state: { type: DataTypes.STRING, allowNull: false },
      pincode: { type: DataTypes.STRING(10), allowNull: false },
      items: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      subtotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      shipping: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      tax: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      payment_mode: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "cod",
      },
      payment_id: { type: DataTypes.STRING(100), allowNull: true },
      payment_status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },
      order_status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "pending",
      },
      is_delete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Payment",
      tableName: "paymentDatabases",
      timestamps: true,
      indexes: [
        { fields: ["is_delete"] },
        { fields: ["user_id"] },
        { fields: ["order_status"] },
      ],
    },
  );

  Payment.associate = (models) => {
    if (models.Register) {
      Payment.belongsTo(models.Register, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  };

  return Payment;
};
