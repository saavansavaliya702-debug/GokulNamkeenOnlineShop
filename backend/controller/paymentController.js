// "use strict";

// const crypto = require("crypto");
// const Razorpay = require("razorpay");
// const { Payment } = require("../models");

// exports.createRazorpayOrder = async (req, res) => {
//   try {
//     const razorpay = new Razorpay({
//       key_id: process.env.RAZORPAY_KEY_ID,
//       key_secret: process.env.RAZORPAY_KEY_SECRET,
//     });

//     const { amount, currency = "INR", receipt } = req.body;

//     if (!amount || amount < 100) {
//       return res.status(400).json({ message: "Amount must be at least 100 paise" });
//     }

//     const order = await razorpay.orders.create({
//       amount: Math.round(amount),
//       currency,
//       receipt: receipt || `rcpt_${Date.now()}`,
//     });

//     res.json({
//       keyId: process.env.RAZORPAY_KEY_ID,
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//     });
//   } catch (err) {
//     console.error("createRazorpayOrder error:", err);
//     res.status(500).json({ message: "Failed to create Razorpay order" });
//   }
// };

// exports.verifyRazorpayPayment = async (req, res) => {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

//     const expected = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//       .digest("hex");

//     if (expected !== razorpay_signature) {
//       return res.status(400).json({ success: false, message: "Invalid signature" });
//     }

//     res.json({ success: true, paymentId: razorpay_payment_id });
//   } catch (err) {
//     console.error("verifyRazorpayPayment error:", err);
//     res.status(500).json({ success: false, message: "Verification failed" });
//   }
// };

// exports.createPayment = async (req, res) => {
//   try {
//     const {
//       items, subtotal, shipping, tax, total,
//       payment_mode, payment_id, payment_status,
//       full_name, email, phone, address, city, state, pincode,
//     } = req.body;

//     if (!items || !Array.isArray(items) || items.length === 0) {
//       return res.status(400).json({ message: "Order has no items" });
//     }
//     if (!full_name || !email || !phone || !address || !city || !state || !pincode) {
//       return res.status(400).json({ message: "All address fields are required" });
//     }

//     // const payment = await Payment.create({
//     //   user_id: req.user?.id || null,
//     //   full_name, email, phone, address, city, state, pincode,
//     //   items,
//     //   subtotal: Number(subtotal) || 0,
//     //   shipping: Number(shipping) || 0,
//     //   tax: Number(tax) || 0,
//     //   total: Number(total) || 0,
//     //   payment_mode: payment_mode || "cod",
//     //   payment_id: payment_id || null,
//     //   payment_status: payment_status || "pending",
//     //   order_status: "pending",
//     // });
//     const payment = await Payment.create({
//   user_id: req.user?.userId || null,   // ✅ was req.user?.id
//   full_name, email, phone, address, city, state, pincode,
//   items,
//   subtotal: Number(subtotal) || 0,
//   shipping: Number(shipping) || 0,
//   tax: Number(tax) || 0,
//   total: Number(total) || 0,
//   payment_mode: payment_mode || "cod",
//   payment_id: payment_id || null,
//   payment_status: payment_status || "pending",
//   order_status: "pending",
// });

//     res.status(201).json(payment);
//   } catch (err) {
//     console.error("createPayment error:", err);
//     res.status(500).json({ message: "Failed to create payment/order" });
//   }
// };

// exports.getAllPayments = async (req, res) => {
//   try {
//     const payments = await Payment.findAll({
//       where: { is_delete: false },
//       order: [["createdAt", "DESC"]],
//     });
//     res.json(payments);
//   } catch (err) {
//     console.error("getAllPayments error:", err);
//     res.status(500).json({ message: "Failed to fetch payments" });
//   }
// };

// // GET /api/payments/my-orders
// exports.getMyOrders = async (req, res) => {
//   try {
//     // JWT payload uses "userId", not "id"
//     const userId = req.user?.userId ?? req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ message: "Not authenticated" });
//     }

//     const orders = await Payment.findAll({
//       where: { user_id: userId, is_delete: false },
//       order: [["createdAt", "DESC"]],
//     });

//     res.json(orders);
//   } catch (err) {
//     console.error("❌ getMyOrders failed:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.getMyPayments = async (req, res) => {
//   try {
//     const payments = await Payment.findAll({
//       where: { user_id: req.user.id, is_delete: false },
//       order: [["createdAt", "DESC"]],
//     });
//     res.json(payments);
//   } catch (err) {
//     console.error("getMyPayments error:", err);
//     res.status(500).json({ message: "Failed to fetch payments" });
//   }
// };

// exports.getPaymentById = async (req, res) => {
//   try {
//     const payment = await Payment.findOne({
//       where: { id: req.params.id, is_delete: false },
//     });
//     if (!payment) return res.status(404).json({ message: "Not found" });
//     res.json(payment);
//   } catch (err) {
//     console.error("getPaymentById error:", err);
//     res.status(500).json({ message: "Failed to fetch payment" });
//   }
// };

// exports.updatePaymentStatus = async (req, res) => {
//   try {
//     const { order_status, payment_status } = req.body;

//     const payment = await Payment.findOne({
//       where: { id: req.params.id, is_delete: false },
//     });
//     if (!payment) return res.status(404).json({ message: "Not found" });

//     if (order_status) payment.order_status = order_status;
//     if (payment_status) payment.payment_status = payment_status;

//     await payment.save();
//     res.json(payment);
//   } catch (err) {
//     console.error("updatePaymentStatus error:", err);
//     res.status(500).json({ message: "Failed to update status" });
//   }
// };

// exports.deletePayment = async (req, res) => {
//   try {
//     const payment = await Payment.findOne({ where: { id: req.params.id } });
//     if (!payment) return res.status(404).json({ message: "Not found" });

//     payment.is_delete = true;
//     await payment.save();

//     res.json({ message: "Deleted", payment });
//   } catch (err) {
//     console.error("deletePayment error:", err);
//     res.status(500).json({ message: "Failed to delete payment" });
//   }
// };

"use strict";

const crypto = require("crypto");
const Razorpay = require("razorpay");
const { Payment, Coupon } = require("../models");
const { Op } = require("sequelize");

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

/**
 * Recompute totals from items + optional coupon.
 * Never trust client-provided subtotal/shipping/tax/total.
 */
async function computeTotals(items = [], couponCode = null) {
  const subtotal = items.reduce(
    (s, i) => s + Number(i.price) * Number(i.quantity || 1),
    0,
  );

  let discount = 0;
  let coupon = null;

  if (couponCode) {
    coupon = await Coupon.findOne({
      where: { code: String(couponCode).toUpperCase(), is_active: true },
    });

    if (coupon) {
      const now = new Date();
      const validTime =
        (!coupon.valid_from || new Date(coupon.valid_from) <= now) &&
        (!coupon.valid_to || new Date(coupon.valid_to) >= now);
      const validUsage =
        coupon.usage_limit == null || coupon.used_count < coupon.usage_limit;
      const validMin = subtotal >= Number(coupon.min_order || 0);

      if (validTime && validUsage && validMin) {
        discount =
          coupon.type === "percent" ?
            Math.round((subtotal * Number(coupon.value)) / 100)
          : Number(coupon.value);

        if (coupon.max_discount != null) {
          discount = Math.min(discount, Number(coupon.max_discount));
        }
        discount = Math.max(0, Math.min(discount, subtotal));
      } else {
        coupon = null; // silently reject — charge full price
      }
    }
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = afterDiscount > 500 ? 0 : 40;
  const tax = Math.round(afterDiscount * 0.05);
  const total = afterDiscount + shipping + tax;

  return { subtotal, discount, coupon, shipping, tax, total };
}

// ═══════════════════════════════════════════
// RAZORPAY — CREATE ORDER
// ═══════════════════════════════════════════
exports.createRazorpayOrder = async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { items, coupon_code } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order has no items" });
    }

    // Recompute on server — ignore any client-sent amount
    const { total } = await computeTotals(items, coupon_code);

    if (total < 1) {
      return res.status(400).json({ message: "Invalid order total" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
    });

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("createRazorpayOrder error:", err);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

// ═══════════════════════════════════════════
// RAZORPAY — VERIFY SIGNATURE
// ═══════════════════════════════════════════
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Missing payment fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid signature" });
    }

    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) {
    console.error("verifyRazorpayPayment error:", err);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

// ═══════════════════════════════════════════
// CREATE PAYMENT / ORDER
// ═══════════════════════════════════════════
exports.createPayment = async (req, res) => {
  try {
    const {
      items,
      payment_mode,
      payment_id,
      payment_status,
      full_name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      coupon_code,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order has no items" });
    }
    if (
      !full_name ||
      !email ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res
        .status(400)
        .json({ message: "All address fields are required" });
    }

    // Server-side recompute — never trust client values
    const { subtotal, discount, coupon, shipping, tax, total } =
      await computeTotals(items, coupon_code);

    const payment = await Payment.create({
      user_id: req.user?.userId || null,
      full_name,
      email,
      phone,
      address,
      city,
      state,
      pincode,
      items,
      subtotal,
      discount,
      coupon_code: coupon?.code || null,
      shipping,
      tax,
      total,
      payment_mode: payment_mode || "cod",
      payment_id: payment_id || null,
      payment_status: payment_status || "pending",
      order_status: "pending",
    });

    // Bump coupon usage only after a successful order
    if (coupon) {
      coupon.used_count += 1;
      await coupon.save();
    }

    res.status(201).json(payment);
  } catch (err) {
    console.error("createPayment error:", err);
    res.status(500).json({ message: "Failed to create payment/order" });
  }
};

// ═══════════════════════════════════════════
// LIST ALL PAYMENTS (admin)
// ═══════════════════════════════════════════
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      where: { is_delete: false },
      order: [["createdAt", "DESC"]],
    });
    res.json(payments);
  } catch (err) {
    console.error("getAllPayments error:", err);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

// ═══════════════════════════════════════════
// GET MY ORDERS (authenticated user)
// ═══════════════════════════════════════════

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.user_id;
    const email  = req.user?.email;

    console.log("🔍 getMyOrders → userId:", userId, "email:", email);

    if (!userId && !email) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const or = [];
    if (userId) or.push({ user_id: userId });
    if (email)  or.push({ email });

    const orders = await Payment.findAll({
      where: {
        is_delete: false,
        [Op.or]: or,
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    console.log("🔍 getMyOrders → found:", orders.length);
    res.json(orders);
  } catch (err) {
    console.error("❌ getMyOrders error:", err);
    res.status(500).json({
      message: "Failed to load orders",
      detail: err.message,
    });
  }
};

// ═══════════════════════════════════════════
// GET ONE PAYMENT
// ═══════════════════════════════════════════
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!payment) return res.status(404).json({ message: "Not found" });
    res.json(payment);
  } catch (err) {
    console.error("getPaymentById error:", err);
    res.status(500).json({ message: "Failed to fetch payment" });
  }
};

// ═══════════════════════════════════════════
// UPDATE STATUS (admin)
// ═══════════════════════════════════════════
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { order_status, payment_status } = req.body;

    const payment = await Payment.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!payment) return res.status(404).json({ message: "Not found" });

    if (order_status) payment.order_status = order_status;
    if (payment_status) payment.payment_status = payment_status;

    await payment.save();
    res.json(payment);
  } catch (err) {
    console.error("updatePaymentStatus error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

// ═══════════════════════════════════════════
// DELETE (soft)
// ═══════════════════════════════════════════
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ where: { id: req.params.id } });
    if (!payment) return res.status(404).json({ message: "Not found" });

    payment.is_delete = true;
    await payment.save();

    res.json({ message: "Deleted", payment });
  } catch (err) {
    console.error("deletePayment error:", err);
    res.status(500).json({ message: "Failed to delete payment" });
  }
};
