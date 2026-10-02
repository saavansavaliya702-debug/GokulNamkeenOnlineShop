"use strict";

const hasColumn = async (queryInterface, tableName, columnName) => {
  const table = await queryInterface.describeTable(tableName);
  return Boolean(table[columnName]);
};

const ensureIndex = async (queryInterface, tableName, field, name) => {
  const indexes = await queryInterface.showIndex(tableName);
  const exists = indexes.some((index) => index.name === name);

  if (!exists) {
    await queryInterface.addIndex(tableName, [field], { name });
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const productTable = "AddProductDatabases";
    if (!(await hasColumn(queryInterface, productTable, "low_stock_alert"))) {
      await queryInterface.addColumn(productTable, "low_stock_alert", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      });
    }
    if (!(await hasColumn(queryInterface, productTable, "is_active"))) {
      await queryInterface.addColumn(productTable, "is_active", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }
    await queryInterface.changeColumn(productTable, "description", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: "",
    });
    await ensureIndex(
      queryInterface,
      productTable,
      "is_delete",
      "AddProductDatabases_is_delete_idx",
    );

    const [accountsWithoutPasswords] = await queryInterface.sequelize.query(`
      SELECT COUNT(*)::integer AS count
      FROM "RegisterDatabases"
      WHERE "password" IS NULL
    `);
    if (accountsWithoutPasswords[0].count > 0) {
      throw new Error(
        "Cannot require RegisterDatabases.password: existing accounts have no password. Resolve those accounts before migrating.",
      );
    }
    await queryInterface.changeColumn("RegisterDatabases", "password", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    const storeTable = "OnlineStores";
    if (!(await hasColumn(queryInterface, storeTable, "is_delete"))) {
      await queryInterface.addColumn(storeTable, "is_delete", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    for (const timestamp of ["createdAt", "updatedAt"]) {
      if (!(await hasColumn(queryInterface, storeTable, timestamp))) {
        await queryInterface.addColumn(storeTable, timestamp, {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        });
      }
    }
    await ensureIndex(
      queryInterface,
      storeTable,
      "is_delete",
      "OnlineStores_is_delete_idx",
    );

    const paymentTable = "paymentDatabases";
    const [orphanedOrders] = await queryInterface.sequelize.query(`
      SELECT COUNT(*)::integer AS count
      FROM "${paymentTable}" AS payment
      WHERE payment."user_id" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1
          FROM "RegisterDatabases" AS users
          WHERE users."id" = payment."user_id"
        )
    `);
    if (orphanedOrders[0].count > 0) {
      throw new Error(
        "Cannot add the payment user foreign key: existing orders reference missing users. Repair those user_id values before migrating.",
      );
    }
    const [foreignKeys] = await queryInterface.sequelize.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        USING (constraint_catalog, constraint_schema, constraint_name)
      JOIN information_schema.constraint_column_usage AS ccu
        USING (constraint_catalog, constraint_schema, constraint_name)
      WHERE tc.table_schema = current_schema()
        AND tc.table_name = '${paymentTable}'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
        AND ccu.table_name = 'RegisterDatabases'
        AND ccu.column_name = 'id'
    `);
    if (foreignKeys.length === 0) {
      await queryInterface.addConstraint(paymentTable, {
        fields: ["user_id"],
        type: "foreign key",
        name: "payment_user_id_fkey",
        references: {
          table: "RegisterDatabases",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
    }

    await ensureIndex(
      queryInterface,
      paymentTable,
      "is_delete",
      "paymentDatabases_is_delete_idx",
    );
    await ensureIndex(
      queryInterface,
      paymentTable,
      "user_id",
      "paymentDatabases_user_id_idx",
    );
    await ensureIndex(
      queryInterface,
      paymentTable,
      "order_status",
      "paymentDatabases_order_status_idx",
    );
  },

  async down(queryInterface, Sequelize) {
    const [foreignKeys] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = current_schema()
        AND table_name = 'paymentDatabases'
        AND constraint_name = 'payment_user_id_fkey'
        AND constraint_type = 'FOREIGN KEY'
    `);
    if (foreignKeys.length > 0) {
      await queryInterface.removeConstraint(
        "paymentDatabases",
        "payment_user_id_fkey",
      );
    }
    for (const [table, name] of [
      ["paymentDatabases", "paymentDatabases_is_delete_idx"],
      ["paymentDatabases", "paymentDatabases_user_id_idx"],
      ["paymentDatabases", "paymentDatabases_order_status_idx"],
      ["OnlineStores", "OnlineStores_is_delete_idx"],
      ["AddProductDatabases", "AddProductDatabases_is_delete_idx"],
    ]) {
      const indexes = await queryInterface.showIndex(table);
      if (indexes.some((index) => index.name === name)) {
        await queryInterface.removeIndex(table, name);
      }
    }
    for (const column of ["updatedAt", "createdAt", "is_delete"]) {
      await queryInterface.removeColumn("OnlineStores", column);
    }
    await queryInterface.removeColumn("AddProductDatabases", "is_active");
    await queryInterface.removeColumn(
      "AddProductDatabases",
      "low_stock_alert",
    );
    await queryInterface.changeColumn(
      "AddProductDatabases",
      "description",
      {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "",
      },
    );
    await queryInterface.changeColumn("RegisterDatabases", "password", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
