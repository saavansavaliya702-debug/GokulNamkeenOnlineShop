module.exports = (sequelize, DataTypes) => {
  const Coupon = sequelize.define(
    "Coupon",
    {
      code:         { type: DataTypes.STRING, allowNull: false, unique: true },
      type:         { type: DataTypes.ENUM("percent", "flat"), allowNull: false, defaultValue: "percent" },
      value:        { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      min_order:    { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      max_discount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      valid_from:   { type: DataTypes.DATE, allowNull: true },
      valid_to:     { type: DataTypes.DATE, allowNull: true },
      usage_limit:  { type: DataTypes.INTEGER, allowNull: true },
      used_count:   { type: DataTypes.INTEGER, defaultValue: 0 },
      is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      timestamps: true,
      tableName: "CouponsDatabase",   // 👈 MUST match the migration
      indexes: [{ fields: ["is_active"] }],
    }
  );
  return Coupon;
};