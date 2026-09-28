const { Op, where, fn, col } = require("sequelize");
const { OnlineStore, sequelize } = require("../models"); // 👈 correct key
const paginate = require("../utils/paginate");
const {
  buildAttributesOption,
  buildSearchOrCondition,
  getWhereConditionFromQuery,
} = require("../utils/queryHelpers");

// ---------- CREATE ----------
const createDemoTodo = async (req, res) => {
  try {
    const data = req.body;

    if (!data?.name || data.name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }
    if (!data?.phone || String(data.phone).trim() === "") {
      return res.status(400).json({ error: "Phone is required" });
    }

    const name = data.name.trim();
    const phone = String(data.phone).trim();

    // 👇 Block ONLY if BOTH name AND phone match an existing row
    const existing = await OnlineStore.findOne({
      where: {
        is_delete: false,
        name: { [Op.iLike]: name }, // same name
        phone: phone, // AND same phone
      },
      raw: true,
    });

    if (existing) {
      return res.status(409).json({
        error: "A user with this name and phone already exists",
        fields: ["name", "phone"],
      });
    }

    // Otherwise, create
    const row = await OnlineStore.create({
      ...data,
      name,
      phone,
      is_delete: false,
    });

    return res.status(201).json({ message: "Created successfully", data: row });
  } catch (error) {
    console.error("❌ FULL ERROR:", JSON.stringify(error, null, 2));
    return res.status(500).json({
      error: error.message,
      details: error.errors?.map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
        type: e.type,
      })),
    });
  }
};

// ---------- FIND ALL (no pagination) ----------
const findAllDemoTodos = async (req, res) => {
  try {
    const { record_number } = req.query;

    // Build where clause dynamically
    const where = { is_delete: false };

    // 👇 ONLY add record_number filter if user actually passed it
    if (record_number && record_number.trim() !== "") {
      where.record_number = record_number.trim();
    }

    console.log("🔍 where:", JSON.stringify(where));

    const rows = await OnlineStore.findAll({
      where,
      raw: true,
      logging: console.log, // optional: see the SQL
    });

    console.log("🔍 rows found:", rows.length);

    res.json({
      success: true,
      total: rows.length,
      record_number: record_number || null,
      data: rows,
    });
  } catch (error) {
    console.error("❌ findAll error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// ---------- GET ALL (paginated) ----------
const getAllDemoTodos = async (req, res) => {
  try {
    const { page, limit, include, exclude, search, searchCols } = req.query;
    const whereCondition = getWhereConditionFromQuery(req.query);

    let findOptions = {
      where: { is_delete: false, ...whereCondition },
      order: [["id", "DESC"]],
      raw: true,
    };

    let pageNum, pageSize;
    if (page || limit) {
      const { offset, ...rest } = paginate(page, limit);
      pageNum = rest.pageNum;
      pageSize = rest.pageSize;
      findOptions = { ...findOptions, offset, limit: pageSize };
    }

    const attributesOption = buildAttributesOption(include, exclude);
    if (attributesOption) findOptions.attributes = attributesOption;

    if (search && search.trim() !== "") {
      const columns =
        searchCols && searchCols.trim() !== "" ?
          searchCols.split(",").map((c) => c.trim())
        : Object.keys(OnlineStore.rawAttributes);

      const orConditions = buildSearchOrCondition(
        OnlineStore,
        columns,
        search,
        sequelize,
      );
      if (orConditions.length > 0) {
        findOptions.where = { ...findOptions.where, [Op.or]: orConditions };
      }
    }

    const { count, rows } = await OnlineStore.findAndCountAll(findOptions);
    res.json({ data: rows, total: count, page: pageNum, pageSize });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------- GET BY ID ----------
const getDemoTodoById = async (req, res) => {
  try {
    const { id } = req.params;
    const row = await OnlineStore.findOne({
      where: { id, is_delete: false },
      raw: true,
    });
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------- UPDATE ----------
const updateDemoTodo = async (req, res) => {
  try {
    const { id } = req.params;
    let data = req.body;
    if (!data?.name) return res.status(400).json({ error: "Name is required" });

    const nameAlreadyExists = await OnlineStore.findOne({
      where: {
        id: { [Op.ne]: id },
        is_delete: false,
        [Op.and]: [
          where(fn("LOWER", col("name")), Op.eq, fn("LOWER", data.name)),
        ],
      },
    });

    if (nameAlreadyExists) {
      return res.status(400).json({ error: "Name already exists" });
    }

    data = { ...data, updatedBy: req.user?.id || null, updatedAt: new Date() };

    const [count] = await OnlineStore.update(data, { where: { id } });
    if (count > 0)
      return res.status(200).json({ message: "Updated successfully" });
    return res.status(400).json({ error: "Update failed." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------- UPDATE STATUS ----------
const updateDemoTodoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const [count] = await OnlineStore.update(req.body, { where: { id } });
    if (count > 0) return res.status(200).json({ message: "Status updated" });
    return res.status(400).json({ error: "Failed to update status" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------- SOFT DELETE ----------
// controller/TodosController.js
const deleteDemoTodo = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Guard against non-numeric IDs
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ message: "Invalid todo ID" });
    }

    const todo = await Todo.findByPk(id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    // soft delete
    todo.is_delete = true;
    await todo.save();

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Delete todo error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
//hard delete
const deleteAllDemoTodos = async (req, res) => {
  try {
    const count = await OnlineStore.destroy({
      where: {}, // no condition = all rows
      truncate: true, // optional: resets auto-increment IDs (MySQL/Postgres)
      // restartIdentity: true, // use for Postgres instead of truncate
    });

    return res.status(200).json({
      message: "All records permanently deleted",
      count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createDemoTodo,
  getAllDemoTodos,
  findAllDemoTodos,
  getDemoTodoById,
  updateDemoTodo,
  deleteDemoTodo,
  updateDemoTodoStatus,
  deleteAllDemoTodos,
};
