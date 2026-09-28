"use strict";

const express = require("express");
const router = express.Router();
const { Op, fn, col } = require("sequelize");
const { Payment, AddProduct, Register } = require("../models");
const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

// Shared revenue filter — paid AND (shipped | delivered | completed)
const REVENUE_STATUSES = ["shipped", "delivered", "completed"];

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/dashboard/stats
───────────────────────────────────────────────────────────── */
router.get("/stats", async (req, res) => {
  try {
    const baseWhere = { is_delete: false };

    // Total revenue
    const revenueRow = await Payment.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("total")), 0), "total"]],
      where: {
        ...baseWhere,
        payment_status: "paid",
        order_status: { [Op.in]: REVENUE_STATUSES },
      },
      raw: true,
    });

    // Today's revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayRevenueRow = await Payment.findOne({
      attributes: [[fn("COALESCE", fn("SUM", col("total")), 0), "total"]],
      where: {
        ...baseWhere,
        payment_status: "paid",
        order_status: { [Op.in]: REVENUE_STATUSES },
        createdAt: { [Op.gte]: todayStart },
      },
      raw: true,
    });

    const totalOrders = await Payment.count({ where: baseWhere });
    const pendingOrders = await Payment.count({
      where: { ...baseWhere, order_status: "pending" },
    });
    const shippedOrders = await Payment.count({
      where: { ...baseWhere, order_status: "shipped" },
    });
    const deliveredOrders = await Payment.count({
      where: { ...baseWhere, order_status: "delivered" },
    });

    const totalProducts = await AddProduct.count({
      where: { is_delete: false },
    });
    const activeProducts = totalProducts;
    const lowStock = await AddProduct.count({
      where: {
        is_delete: false,
        stock: { [Op.gt]: 0, [Op.lte]: 5 },
      },
    });
    const outOfStock = await AddProduct.count({
      where: { is_delete: false, stock: 0 },
    });

    const totalCustomers = await Register.count({
      where: { is_delete: false, is_admin: false },
    });

    res.json({
      revenue: {
        total: Number(revenueRow?.total || 0),
        today: Number(todayRevenueRow?.total || 0),
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock,
        outOfStock,
      },
      customers: { total: totalCustomers },
    });
  } catch (err) {
    console.error("stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/dashboard/recent-orders
───────────────────────────────────────────────────────────── */
router.get("/recent-orders", async (req, res) => {
  try {
    const orders = await Payment.findAll({
      where: { is_delete: false },
      order: [["createdAt", "DESC"]],
      limit: 5,
      raw: true,
    });

    res.json(
      orders.map((o) => ({
        id: o.id,
        customer_name: o.full_name,
        customer_email: o.email,
        total_amount: o.total,
        status: o.order_status,
        created_at: o.createdAt,
      })),
    );
  } catch (err) {
    console.error("recent-orders error:", err);
    res.status(500).json({ message: "Failed to load recent orders" });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/dashboard/low-stock
───────────────────────────────────────────────────────────── */
router.get("/low-stock", async (req, res) => {
  try {
    const products = await AddProduct.findAll({
      where: {
        is_delete: false,
        stock: { [Op.lte]: 5 },
      },
      order: [["stock", "ASC"]],
      limit: 10,
      attributes: ["id", "name", "image", "category", "price", "stock"],
      raw: true,
    });

    res.json(
      products.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category,
        price: p.price,
        stock_quantity: p.stock,
      })),
    );
  } catch (err) {
    console.error("low-stock error:", err);
    res.status(500).json({ message: "Failed to load low stock" });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/dashboard/revenue-chart
───────────────────────────────────────────────────────────── */
router.get("/revenue-chart", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rows = await Payment.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("SUM", col("total")), "revenue"],
        [fn("COUNT", col("id")), "orders"],
      ],
      where: {
        is_delete: false,
        payment_status: "paid",
        order_status: { [Op.in]: REVENUE_STATUSES },
        createdAt: { [Op.gte]: sevenDaysAgo },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
      raw: true,
    });

    const map = {};
    rows.forEach((r) => {
      const key =
        typeof r.date === "string"
          ? r.date
          : new Date(r.date).toISOString().slice(0, 10);
      map[key] = {
        revenue: Number(r.revenue || 0),
        orders: Number(r.orders || 0),
      };
    });

    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({
        date: key,
        revenue: map[key]?.revenue || 0,
        orders: map[key]?.orders || 0,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("revenue-chart error:", err);
    res.status(500).json({ message: "Failed to load revenue chart" });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/dashboard/top-products
───────────────────────────────────────────────────────────── */
router.get("/top-products", async (req, res) => {
  try {
    const orders = await Payment.findAll({
      where: {
        is_delete: false,
        payment_status: "paid",
        order_status: { [Op.in]: REVENUE_STATUSES },
      },
      attributes: ["items"],
      raw: true,
    });

    const agg = {};

    orders.forEach((o) => {
      const items = Array.isArray(o.items) ? o.items : [];
      items.forEach((it) => {
        const id = it.id ?? it.product_id ?? it.productId;
        if (!id) return;

        const qty = Number(it.quantity ?? it.qty ?? 1);
        const price = Number(it.price ?? 0);

        if (!agg[id]) {
          agg[id] = {
            id,
            name: it.name || it.title || `Product #${id}`,
            image: it.image || null,
            total_sold: 0,
            total_revenue: 0,
          };
        }
        agg[id].total_sold += qty;
        agg[id].total_revenue += qty * price;
      });
    });

    const top = Object.values(agg)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, 5);

    res.json(top);
  } catch (err) {
    console.error("top-products error:", err);
    res.status(500).json({ message: "Failed to load top products" });
  }
});

module.exports = router;