const express = require("express");
const {
  createDemoTodo,
  getAllDemoTodos,
  getDemoTodoById,
  updateDemoTodo,
  findAllDemoTodos,
  updateDemoTodoStatus,
  deleteDemoTodo,
  deleteAllDemoTodos,
} = require("../controller/TodosController");

const router = express.Router();

// ─────────────────────────────
// SPECIFIC ROUTES FIRST (must come BEFORE /:id)
// ─────────────────────────────

// READ ALL
router.get("/", getAllDemoTodos);

// FIND ALL (with filters)
router.get("/find-all", findAllDemoTodos);

// ⭐ DELETE ALL — MUST come before /:id
router.delete("/all", deleteAllDemoTodos);

// ─────────────────────────────
// CREATE
// ─────────────────────────────
router.post("/", createDemoTodo);

// ─────────────────────────────
// DYNAMIC ROUTES (:id) — MUST BE LAST
// ─────────────────────────────
router.get("/:id", getDemoTodoById);
router.put("/:id", updateDemoTodo);
router.patch("/:id/status", updateDemoTodoStatus);
router.delete("/:id", deleteDemoTodo);

module.exports = router;