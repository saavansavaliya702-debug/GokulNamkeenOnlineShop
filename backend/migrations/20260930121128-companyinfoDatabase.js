"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("companyinfoDatabase", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Gokul Namkeen",
      },
      founder: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      units: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      address_street: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address_city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address_state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phones: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      emails: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // ⭐ Social links
      facebook: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      instagram: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      twitter: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      tagline: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      investors: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      business_partners: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      international_partners: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),  // 👈 FIXED
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("companyinfoDatabase");
  },
};