// "use strict";

// const express = require("express");
// const { fn, col, literal } = require("sequelize");
// const router = express.Router();
// const db = require("../models");

// const { Register, Order } = db;

// console.log("🔍 adminRoutes loaded. Register:", !!Register, "Order:", !!Order);

// /* GET /api/admin/users */
// router.get("/users", async (req, res) => {
//   try {
//     const users = await Register.findAll({
//       where: { is_delete: false },
//       attributes: [
//         "id",
//         "name",
//         "email",
//         "is_verified",
//         "is_admin",
//         "createdAt",
//         [fn("COUNT", col("payment.id")), "order_count"],
//         [fn("MAX", col("payment.createdAt")), "last_order_at"],
//       ],
//       include: [
//         { model: Order, as: "payment", attributes: [], required: false },
//       ],
//       group: ["Register.id"],
//       order: [["createdAt", "DESC"]],
//       raw: true,
//     });
//     res.json(users);
//   } catch (err) {
//     console.error("GET /users error:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /* GET /api/admin/lost-users?days=30 */
// router.get("/lost-users", async (req, res) => {
//   const days = parseInt(req.query.days, 10) || 30;
//   const cutoff = new Date(Date.now() - days * 86400000);
//   const cutoffStr = cutoff.toISOString().slice(0, 19).replace("T", " ");

//   try {
//     const days = parseInt(req.query.days, 10) || 30;

//     const users = await Register.findAll({
//       where: { is_delete: false },
//       attributes: [
//         "id",
//         "name",
//         "email",
//         "createdAt",
//         [fn("COUNT", col("payment.id")), "order_count"],
//         [fn("MAX", col("payment.createdAt")), "last_order_at"],
//       ],
//       include: [
//         { model: Order, as: "payment", attributes: [], required: false },
//       ],
//       group: ["Register.id"],
//       having: literal(
//         `MAX(payment.createdAt) IS NULL OR MAX(payment.createdAt) < '${cutoffStr}'`,
//       ),
//       order: [[literal("last_order_at"), "ASC"]],
//       raw: true,
//     });
//     res.json({ days, count: users.length, users });
//     res.json(result);
//   } catch (err) {
//     console.error("GET /lost-users error:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /* GET /api/admin/feedback */
// router.get("/feedback", async (req, res) => {
//   try {
//     if (!db.Feedback) return res.json([]);
//     const rows = await db.Feedback.findAll({
//       include: [
//         { model: Register, as: "user", attributes: ["id", "name", "email"] },
//       ],
//       order: [["createdAt", "DESC"]],
//     });
//     res.json(rows);
//   } catch (err) {
//     console.error("GET /feedback error:", err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// /* DELETE /api/admin/users/:id */
// router.delete("/users/:id", async (req, res) => {
//   try {
//     const user = await Register.findByPk(req.params.id);
//     if (!user) return res.status(404).json({ error: "User not found" });
//     user.is_delete = true;
//     await user.save();
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;


"use strict";

const express = require("express");
const { fn, col, literal } = require("sequelize");
const router = express.Router();
const db = require("../models");

const { Register, Order } = db;

console.log("🔍 adminRoutes loaded. Register:", !!Register, "Order:", !!Order);

/* ============================================================
   GET /api/admin/users
   ============================================================ */
router.get("/users", async (req, res) => {
  try {
    const users = await Register.findAll({
      where: { is_delete: false },
      attributes: [
        "id",
        "name",
        "email",
        "is_verified",
        "is_admin",
        "createdAt",
        [fn("COUNT", col("payment.id")), "order_count"],
        [fn("MAX", col("payment.createdAt")), "last_order_at"],
      ],
      include: [
        { model: Order, as: "payment", attributes: [], required: false },
      ],
      group: ["Register.id"],
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    const data = users.map((u) => ({
      ...u,
      order_count: Number(u.order_count || 0),
    }));

    res.json(data);
  } catch (err) {
    console.error("GET /users error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   GET /api/admin/lost-users?days=30
   ============================================================ */
router.get("/lost-users", async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const cutoff = new Date(Date.now() - days * 86400000);

    const users = await Register.findAll({
      where: { is_delete: false },
      attributes: [
        "id",
        "name",
        "email",
        "createdAt",
        [fn("COUNT", col("payment.id")), "order_count"],
        [fn("MAX", col("payment.createdAt")), "last_order_at"],
      ],
      include: [
        { model: Order, as: "payment", attributes: [], required: false },
      ],
      group: ["Register.id"],
      raw: true,
    });

    const data = users
      .map((u) => ({
        ...u,
        order_count: Number(u.order_count || 0),
        last_order_at: u.last_order_at ? new Date(u.last_order_at) : null,
      }))
      .filter((u) => !u.last_order_at || u.last_order_at < cutoff)
      .sort((a, b) => {
        const at = a.last_order_at ? a.last_order_at.getTime() : 0;
        const bt = b.last_order_at ? b.last_order_at.getTime() : 0;
        return at - bt;
      });

    res.json({ days, count: data.length, users: data });
  } catch (err) {
    console.error("GET /lost-users error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   GET /api/admin/feedback
   Uses Contact model (ContactDatabases) as feedback source
   ============================================================ */
router.get("/feedback", async (req, res) => {
  try {
    const Contact = db.Contact;
    if (!Contact) {
      console.warn("⚠️  Contact model not loaded");
      return res.json([]);
    }

    const rows = await Contact.findAll({
      where: { is_delete: false },
      attributes: [
        "id",
        "name",
        "email",
        "phone",
        "subject",
        "message",
        "is_verified",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // Normalize to the shape the frontend expects
    const data = rows.map((c) => ({
      id: c.id,
      rating: null,
      subject: c.subject,
      message: c.message,
      createdAt: c.createdAt,
      user: {
        id: null,
        name: c.name,
        email: c.email,
        phone: c.phone,
        is_verified: c.is_verified,
      },
    }));

    res.json(data);
  } catch (err) {
    console.error("GET /feedback error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DELETE /api/admin/users/:id  (soft delete)
   ============================================================ */
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await Register.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.is_delete = true;
    await user.save();
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /users error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ============================================================
   DELETE /api/admin/feedback/:id  (soft delete contact message)
   ============================================================ */
router.delete("/feedback/:id", async (req, res) => {
  try {
    const Contact = db.Contact;
    if (!Contact) return res.status(404).json({ error: "Contact model not loaded" });

    const [updated] = await Contact.update(
      { is_delete: true },
      { where: { id: req.params.id } }
    );

    if (!updated) return res.status(404).json({ error: "Feedback not found" });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /feedback error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
/* ============================================================
   GET /api/admin/customer-items
   For each registered user, return:
     - total orders placed
     - total items purchased (sum of items across all orders)
     - total amount spent
     - list of purchased items (name, qty, price)
   ============================================================ */
router.get("/customer-items", async (req, res) => {
  try {
    const users = await Register.findAll({
      where: { is_delete: false },
      attributes: ["id", "name", "email", "createdAt"],
      raw: true,
    });

    const orders = await Order.findAll({
      where: { is_delete: false },
      attributes: ["id", "user_id", "items", "total", "createdAt"],
      raw: true,
    });

    // Group orders by user_id
    const byUser = new Map();

    for (const o of orders) {
      if (!o.user_id) continue;

      if (!byUser.has(o.user_id)) {
        byUser.set(o.user_id, {
          orderCount: 0,
          itemsCount: 0,
          amountSpent: 0,
          items: {},          // name -> { qty, price, totalSpent }
          lastOrderAt: null,
        });
      }

      const entry = byUser.get(o.user_id);
      entry.orderCount += 1;
      entry.amountSpent += Number(o.total) || 0;

      // Last order timestamp
      if (!entry.lastOrderAt || new Date(o.createdAt) > new Date(entry.lastOrderAt)) {
        entry.lastOrderAt = o.createdAt;
      }

      // Parse items (array of { name, qty/quantity, price, ... })
      let itemsArr = o.items;
      if (typeof itemsArr === "string") {
        try { itemsArr = JSON.parse(itemsArr); } catch { itemsArr = []; }
      }
      if (!Array.isArray(itemsArr)) itemsArr = [];

      for (const it of itemsArr) {
        const name = it.name || it.productName || "Unknown";
        const qty = Number(it.qty ?? it.quantity ?? 1) || 1;
        const price = Number(it.price ?? 0) || 0;

        entry.itemsCount += qty;

        if (!entry.items[name]) {
          entry.items[name] = { qty: 0, price, totalSpent: 0 };
        }
        entry.items[name].qty += qty;
        entry.items[name].price = price;
        entry.items[name].totalSpent += qty * price;
      }
    }

    // Merge users with stats
    const data = users.map((u) => {
      const s = byUser.get(u.id) || {
        orderCount: 0,
        itemsCount: 0,
        amountSpent: 0,
        items: {},
        lastOrderAt: null,
      };

      const itemList = Object.entries(s.items)
        .map(([name, v]) => ({
          name,
          qty: v.qty,
          price: v.price,
          totalSpent: v.totalSpent,
        }))
        .sort((a, b) => b.qty - a.qty);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        orderCount: s.orderCount,
        itemsCount: s.itemsCount,
        amountSpent: s.amountSpent,
        lastOrderAt: s.lastOrderAt,
        items: itemList,
      };
    });

    // Biggest buyers first
    data.sort((a, b) => b.itemsCount - a.itemsCount);

    res.json(data);
  } catch (err) {
    console.error("GET /customer-items error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;