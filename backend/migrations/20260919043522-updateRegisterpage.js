"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn("RegisterDatabases", "is_admin", {
        type: Sequelize.BOOLEAN, // ✅ correct
        allowNull: false,
        defaultValue: false,
      });
    } catch (e) {
      console.error("Error creating States status table:", e);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn("RegisterDatabases", "is_admin");
    } catch (e) {
      console.error("Error creating States status table:", e);
    }
  },
};

