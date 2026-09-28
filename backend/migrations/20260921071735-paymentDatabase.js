"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("paymentDatabases", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true, // guests can order too
       
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),   // 🔑 STRING, not INTEGER
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      pincode: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      items: {
        type: Sequelize.JSONB,        // 🔑 stores the whole cart array
        allowNull: false,
        defaultValue: [],
      },
      subtotal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      shipping: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      tax: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      payment_mode: {
        type: Sequelize.STRING(30),   // 🔑 renamed from modePayment
        allowNull: false,
        defaultValue: "cod",
      },
      payment_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      payment_status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "pending",      // "pending" | "paid" | "failed"
      },
      order_status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "pending",      // "pending" | "shipped" | "delivered" | "cancelled"
      },
      is_delete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("paymentDatabases");
  },
};