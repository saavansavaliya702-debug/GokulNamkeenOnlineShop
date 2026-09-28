"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.createTable("LoginDatabases", {
        id: {
          allowNull: false,
          autoIncrement: true,

          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        email: {
          allowNull: true,
          type: Sequelize.STRING,
        },
        password: {
          type: Sequelize.STRING,
        },
         createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
      });

      console.log("User Account created successfully.");
    } catch (error) {
      console.log("User Account Removed successfully.", error);
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
