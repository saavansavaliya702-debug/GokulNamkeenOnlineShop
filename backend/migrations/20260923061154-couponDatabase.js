"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("CouponsDatabase", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING,
        allowNull: false,
        // no `unique: true` here — the unique index below covers it
      },

      type: {
        type: Sequelize.ENUM("percent", "flat"),
        allowNull: false,
        defaultValue: "percent",
      },

      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      min_order: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0,
      },

      max_discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      valid_from: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      valid_to: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      used_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Indexes — target the actual table name
    await queryInterface.addIndex("CouponsDatabase", ["code"], {
      unique: true,
      name: "coupons_code_unique",
    });

    await queryInterface.addIndex("CouponsDatabase", ["is_active"], {
      name: "coupons_is_active_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the table
    await queryInterface.dropTable("CouponsDatabase");

    // Postgres keeps the ENUM as a standalone type.
    // Its name is derived from the table name: enum_<table>_<column>
    await queryInterface.sequelize
      .query('DROP TYPE IF EXISTS "enum_CouponsDatabase_type";')
      .catch(() => {});
  },
};