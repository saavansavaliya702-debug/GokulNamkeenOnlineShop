"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add only the columns that don't already exist
    const table = await queryInterface.describeTable("RegisterDatabases");

    if (!table.otp) {
      await queryInterface.addColumn("RegisterDatabases", "otp", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    if (!table.otp_expires_at) {
      await queryInterface.addColumn("RegisterDatabases", "otp_expires_at", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
    if (!table.is_verified) {
      await queryInterface.addColumn("RegisterDatabases", "is_verified", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    if (!table.is_delete) {
      await queryInterface.addColumn("RegisterDatabases", "is_delete", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("RegisterDatabases", "is_delete");
    await queryInterface.removeColumn("RegisterDatabases", "is_verified");
    await queryInterface.removeColumn("RegisterDatabases", "otp_expires_at");
    await queryInterface.removeColumn("RegisterDatabases", "otp");
  },
};