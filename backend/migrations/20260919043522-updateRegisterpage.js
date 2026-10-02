"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("RegisterDatabases");
    if (!table.is_admin) {
      await queryInterface.addColumn("RegisterDatabases", "is_admin", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("RegisterDatabases");
    if (table.is_admin) {
      await queryInterface.removeColumn("RegisterDatabases", "is_admin");
    }
  },
};
