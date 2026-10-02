const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { Payment, AddProduct } = require("../models");

async function reduceStockForOrder(order) {
  if (!order || !Array.isArray(order.items)) return;
  for (const item of order.items) {
    const productId = item.id ?? item.productId;
    if (!productId) continue;
    const product = await AddProduct.findByPk(productId);
    if (!product) continue;
    const qty = Number(item.qty ?? item.quantity ?? 1) || 1;
    await product.update({
      stock: Math.max(0, Number(product.stock || 0) - qty),
    });
  }
}

router.put("/:id/status", protect, adminOnly, async (req, res) => {
  try {
    const { order_status } = req.body;
    console.log("🟡 Status update request:", {
      orderId: req.params.id,
      newStatus: order_status,
    });

    const order = await Payment.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    console.log("🔍 Order items:", JSON.stringify(order.items, null, 2));

    const prevStatus = order.order_status;
    order.order_status = order_status;
    await order.save();

    if (order_status === "delivered" && prevStatus !== "delivered") {
      console.log("📉 Reducing stock...");
      await reduceStockForOrder(order);
      console.log(`✅ Stock reduced for order #${order.id}`);
    } else {
      console.log(
        `⏭ Skipping stock reduce (prev=${prevStatus}, new=${order_status})`
      );
    }

    res.json(order);
  } catch (err) {
    console.error("❌ Status update error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;