"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable("OnlineStores", {
        id: {
          allowNull: false,
          autoIncrement: true,

          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        name: {
          allowNull: true,
          type: Sequelize.STRING,
        },
        phone: {
          allowNull: true,
          type: Sequelize.STRING,
        },
        record_number: {
          type: Sequelize.STRING,
        },
      });

      console.log("DemoTodos table created successfully.");
    } catch (error) {
      console.log("DemoTodos table Removed successfully.", error);
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
