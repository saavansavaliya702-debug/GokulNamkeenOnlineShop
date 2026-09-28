module.exports = (sequelize, Sequelize, DataTypes) => {
  const OnlineStore = sequelize.define(
    "OnlineStore",
    {
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
      is_delete: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
    },
    {
      sequelize,
      modelName: "OnlineStore",
      tableName: "OnlineStores", // 👈 snake_case avoids Postgres case-folding pain
      timestamps: true,
      indexes: [{ fields: ["is_delete"] }], // ✅ now valid — column exists
    },
  );

  OnlineStore.associate = () => {};

  return OnlineStore;
};
