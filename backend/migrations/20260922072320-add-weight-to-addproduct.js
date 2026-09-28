"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("AddProductDatabases", "weight", {
      type: Sequelize.FLOAT,
      allowNull: true,
      defaultValue: null,
      after: "category",       // MySQL only; ignore for Postgres
    });

    await queryInterface.addColumn("AddProductDatabases", "weightUnit", {
      type: Sequelize.ENUM("g", "kg", "ml", "l", "pcs"),
      allowNull: false,
      defaultValue: "g",
      after: "weight",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("AddProductDatabases", "weightUnit");
    await queryInterface.removeColumn("AddProductDatabases", "weight");

    // If Postgres, drop the enum type too:
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_AddProductDatabases_weightUnit";');
  },
};