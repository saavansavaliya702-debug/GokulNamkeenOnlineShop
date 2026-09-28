"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ContactDatabases", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      subject: { type: Sequelize.STRING, allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: false },

      // ✅ ADD these two — they're referenced by the indexes below
      is_delete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });

    await queryInterface.addIndex("ContactDatabases", ["is_delete"]);
    await queryInterface.addIndex("ContactDatabases", ["email"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("ContactDatabases");
  },
};
