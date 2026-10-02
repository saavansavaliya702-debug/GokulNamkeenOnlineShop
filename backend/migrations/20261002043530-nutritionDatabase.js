'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('NutritionsDatabase', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true, // one nutrition row per product
        references: {
          model: 'AddProductDatabases',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      energy_kcal: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 512,
      },
      protein_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 12.4,
      },
      carbohydrates_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 48.6,
      },
      total_fat_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 29.8,
      },
      saturated_fat_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 6.2,
      },
      dietary_fiber_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 5.1,
      },
      sodium_mg: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 780,
      },
      sugar_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 2.3,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('NutritionsDatabase');
  },
};