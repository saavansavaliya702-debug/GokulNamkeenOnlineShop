// backend/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { protect, adminOnly } = require("../middleware/auth");
const { Order, AddProduct, Coupon } = require("../models");
const Razorpay = require("razorpay");

function getRazorpay() {
  const key_id = (
    process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY ||
    ""
  ).trim();
  const key_secret = (
    process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_SECRET ||
    ""
  ).trim();

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay credentials are not properly configured in environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)."
    );
  }

  return new Razorpay({ key_id, key_secret });
}

/* ═══════════════════════════════════════════════════════════════
   STOCK REDUCTION HELPER
   ═══════════════════════════════════════════════════════════════ */
async function reduceStockForOrder(order) {
  if (!order || !Array.isArray(order.items)) {
    console.log("⚠️ reduceStockForOrder: order.items is not an array");
    return;
  }

  console.log(`🔍 reduceStockForOrder: ${order.items.length} line(s)`);

  for (const line of order.items) {
    const productId = line.id ?? line.productId ?? line.product_id;
    if (!productId) {
      console.log("⚠️ Skipping item with no id:", line);
      continue;
    }

    const product = await AddProduct.findByPk(productId);
    if (!product) {
      console.warn(`⚠️ Product #${productId} not found for order #${order.id}`);
      continue;
    }

    const orderedQty = Number(line.qty ?? line.quantity ?? 1) || 1;
    const variants = Array.isArray(product.variants) ? product.variants : [];

    if (variants.length > 0) {
      let matched = false;
      const updatedVariants = variants.map((v) => {
        const sameWeight = String(v.weight ?? "") === String(line.weight ?? "");
        const sameUnit =
          String(v.weightUnit ?? "") === String(line.weightUnit ?? "");
        const samePcs = Number(v.pcs ?? 0) === Number(line.pcs ?? 0);

        if (sameWeight && sameUnit && samePcs) {
          matched = true;
          return {
            ...v,
            stock: Math.max(0, Number(v.stock || 0) - orderedQty),
          };
        }
        return v;
      });

      if (!matched) {
        console.log(
          `⚠️ No variant match. Line: weight=${line.weight} ${line.weightUnit} pcs=${line.pcs}`,
        );
      }

      const newTotal = updatedVariants.reduce(
        (s, v) => s + (Number(v.stock) || 0),
        0,
      );

      await product.update({ variants: updatedVariants, stock: newTotal });
      console.log(
        `📦 Product #${productId} (variant): total stock → ${newTotal}`,
      );
    } else {
      const newStock = Math.max(0, Number(product.stock || 0) - orderedQty);
      await product.update({ stock: newStock });
      console.log(`📦 Product #${productId}: stock → ${newStock}`);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   RESTORE STOCK (cancelled after delivered)
   ═══════════════════════════════════════════════════════════════ */
async function restoreStockForOrder(order) {
  if (!order || !Array.isArray(order.items)) return;

  for (const line of order.items) {
    const productId = line.id ?? line.productId ?? line.product_id;
    if (!productId) continue;

    const product = await AddProduct.findByPk(productId);
    if (!product) continue;

    const qty = Number(line.qty ?? line.quantity ?? 1) || 1;
    const variants = Array.isArray(product.variants) ? product.variants : [];

    if (variants.length > 0) {
      const updatedVariants = variants.map((v) => {
        const match =
          String(v.weight ?? "") === String(line.weight ?? "") &&
          String(v.weightUnit ?? "") === String(line.weightUnit ?? "") &&
          Number(v.pcs ?? 0) === Number(line.pcs ?? 0);
        return match ? { ...v, stock: Number(v.stock || 0) + qty } : v;
      });

      const newTotal = updatedVariants.reduce(
        (s, v) => s + (Number(v.stock) || 0),
        0,
      );
      await product.update({ variants: updatedVariants, stock: newTotal });
    } else {
      await product.update({ stock: Number(product.stock || 0) + qty });
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   POST /api/payments/create-order — Razorpay
   ═══════════════════════════════════════════════════════════════ */
router.post("/create-order", async (req, res) => {
  try {
    console.log("=== create-order hit ===");
    console.log("body:", req.body);
    console.log("user:", req.user?.id);

    const { items, coupon_code } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    /* Server-side total calculation (never trust the client) */
    const subtotal = items.reduce(
      (s, it) =>
        s +
        (Math.max(0, Number(it.price) || 0) *
          Math.max(1, Number(it.quantity || it.qty || 1) || 1)),
      0,
    );

    let discount = 0;
    if (coupon_code) {
      try {
        const coupon = await Coupon.findOne({
          where: {
            code: String(coupon_code).toUpperCase(),
            is_delete: false,
          },
        });
        if (coupon) {
          discount =
            coupon.type === "percent"
              ? Math.round((subtotal * Number(coupon.value)) / 100)
              : Number(coupon.value) || 0;
        }
      } catch (e) {
        console.error("coupon lookup failed:", e);
        discount = 0;
      }
    }

    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping = afterDiscount > 500 || afterDiscount === 0 ? 0 : 40;
    const tax = Math.round(afterDiscount * 0.05);
    const totalRupees = afterDiscount + shipping + tax;
    const amountPaise = Math.round(totalRupees * 100);

    if (amountPaise < 100) {
      return res.status(400).json({ message: "Amount must be at least ₹1" });
    }

    const rzp = getRazorpay();
    const rzpOrder = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { coupon: coupon_code || "" },
    });
    console.log("rzpOrder", rzpOrder);

    const keyId = (
      process.env.RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY ||
      ""
    ).trim();

    res.json({
      keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: rzpOrder.id,
      subtotal,
      discount,
      shipping,
      tax,
      total: totalRupees,
    });
  } catch (err) {
    console.error("create-order error:", err);
    console.error(err?.stack);
    const errorMsg =
      err?.error?.description ||
      err?.description ||
      err?.message ||
      "Failed to create order";
    res.status(500).json({
      message: errorMsg,
      code: err?.code || err?.error?.code,
      description: errorMsg,
    });
  }
});

/* ═══════════════════════════════════════════════════════════════
   POST /api/payments/verify — Razorpay signature check
   ═══════════════════════════════════════════════════════════════ */
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const secret = (
      process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_SECRET ||
      ""
    ).trim();

    if (!secret) {
      return res
        .status(500)
        .json({ success: false, message: "Razorpay secret key not configured" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const valid = expectedSignature === razorpay_signature;

    if (!valid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) {
    console.error("verify error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   POST /api/payments — save order to DB (both COD & online)
   ═══════════════════════════════════════════════════════════════ */
router.post("/", async (req, res) => {
  try {
    const {
      items,
      subtotal,
      discount,
      coupon_code,
      shipping,
      tax,
      total,
      full_name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      payment_mode,
      payment_id,
      payment_status,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(
          authHeader.slice(7),
          process.env.JWT_SECRET || "secret",
        );
        userId = decoded.id || decoded.userId || null;
      } catch {
        userId = null;
      }
    }

    /* Normalize item shape so reduceStockForOrder can match variants */
    const normalizedItems = items.map((it) => ({
      id: it.product_id ?? it.id ?? null,
      name: it.name,
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
      qty: Number(it.quantity) || 1,
      image: it.image || "",
      weight: it.weight ?? null,
      weightUnit: it.weightUnit ?? null,
      pcs: Number(it.pcs) || 0,
    }));

    const order = await Order.create({
      user_id: userId,
      items: normalizedItems,
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      tax: Number(tax) || 0,
      total: Number(total) || 0,
      coupon_code: coupon_code || null,
      discount: Number(discount) || 0,
      full_name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      payment_mode: payment_mode || "cod",
      payment_id: payment_id || null,
      payment_status: payment_status || "pending",
      order_status: "pending",
    });

    res.status(201).json(order);
  } catch (err) {
    console.error("POST /payments error:", err);
    res.status(500).json({ message: err.message || "Failed to save order" });
  }
});

/* ═══════════════════════════════════════════════════════════════
   GET /api/payments — admin: all orders
   ═══════════════════════════════════════════════════════════════ */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { is_delete: false },
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    console.error("GET /payments error:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

/* ═══════════════════════════════════════════════════════════════
   GET /api/payments/my-orders — current user's orders
   ═══════════════════════════════════════════════════════════════ */
router.get("/my-orders", protect, async (req, res) => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    const orders = await Order.findAll({
      where: { user_id: userId, is_delete: false },
      order: [["createdAt", "DESC"]],
    });
    res.json(orders);
  } catch (err) {
    console.error("GET /my-orders error:", err);
    res.status(500).json({ message: "Failed to load orders" });
  }
});

/* ═══════════════════════════════════════════════════════════════
   ⭐ GET /api/payments/:id — get one order (detail page)
   MUST come after /my-orders and before /:id/status
   ═══════════════════════════════════════════════════════════════ */
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order || order.is_delete) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("getOrderById:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch order", error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   PUT /api/payments/:id/status — update status + reduce stock
   ═══════════════════════════════════════════════════════════════ */
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  console.log("🎯🎯🎯 HANDLER HIT /payments/:id/status");
  console.log("   Order ID:", req.params.id);
  console.log("   Body:", JSON.stringify(req.body));

  try {
    const orderId = req.params.id;

    const order = await Order.findByPk(orderId);
    if (!order) {
      console.log("   ❌ Order not found");
      return res.status(404).json({ message: "Order not found" });
    }

    const prevOrderStatus = order.order_status;
    const patch = req.body || {};

    console.log("🟡 Status change:", {
      orderId,
      prevOrderStatus,
      newOrderStatus: patch.order_status,
    });
    console.log("📋 order.items:", JSON.stringify(order.items, null, 2));

    await order.update(patch);

    if (patch.order_status === "delivered" && prevOrderStatus !== "delivered") {
      console.log("📉 Reducing stock...");
      try {
        await reduceStockForOrder(order);
        console.log(`✅ Stock reduced for order #${order.id}`);
      } catch (err) {
        console.error("❌ Stock reduce failed:", err.message);
        console.error(err.stack);
      }
    } else {
      console.log(
        `⏭ Skipping stock reduce (prev=${prevOrderStatus}, new=${patch.order_status})`,
      );
    }

    if (patch.order_status === "cancelled" && prevOrderStatus === "delivered") {
      try {
        await restoreStockForOrder(order);
        console.log(`♻️ Stock restored for order #${order.id}`);
      } catch (err) {
        console.error("❌ Stock restore failed:", err.message);
      }
    }

    const fresh = await Order.findByPk(orderId);
    res.json(fresh);
  } catch (err) {
    console.error("PUT /payments/:id/status error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   DELETE /api/payments/:id — soft delete
   ═══════════════════════════════════════════════════════════════ */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    await order.update({ is_delete: true });
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /payments/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;