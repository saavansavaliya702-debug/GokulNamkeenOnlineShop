"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("AddProductDatabases", "variants", {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });

    // Make price nullable (since it's now optional)
    await queryInterface.changeColumn("AddProductDatabases", "price", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("AddProductDatabases", "variants");
    await queryInterface.changeColumn("AddProductDatabases", "price", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};