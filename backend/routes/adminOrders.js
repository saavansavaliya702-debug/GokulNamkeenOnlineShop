"use strict";

const express = require("express");
const router = express.Router();
const { Payment } = require("../models");
const adminAuth = require("../middleware/adminAuth");

router.use(adminAuth);

// PATCH /api/admin/orders/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const { order_status, payment_status } = req.body;

    const allowedOrder = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const allowedPay = ["pending", "paid", "failed"];

    if (order_status && !allowedOrder.includes(order_status)) {
      return res.status(400).json({ error: "Invalid order_status" });
    }
    if (payment_status && !allowedPay.includes(payment_status)) {
      return res.status(400).json({ error: "Invalid payment_status" });
    }

    const order = await Payment.findByPk(req.params.id);
    if (!order || order.is_delete) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order_status) order.order_status = order_status;
    if (payment_status) order.payment_status = payment_status;
    await order.save();

    res.json({ message: "Status updated", data: order });
  } catch (err) {
    console.error("order status error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;