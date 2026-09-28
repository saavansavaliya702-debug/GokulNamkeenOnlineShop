const express = require("express");
const router = express.Router();
const { Coupon } = require("../models");

// ── Validate a coupon (no auth required — checkout is public) ──
router.post("/validate", async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) return res.status(400).json({ valid: false, message: "Coupon code required" });

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase(), is_active: true },
    });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: "Coupon not found" });
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return res.status(400).json({ valid: false, message: "Coupon not active yet" });
    }
    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      return res.status(400).json({ valid: false, message: "Coupon expired" });
    }
    if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit) {
      return res.status(400).json({ valid: false, message: "Coupon usage limit reached" });
    }
    if (Number(subtotal) < Number(coupon.min_order || 0)) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order ₹${coupon.min_order} required`,
      });
    }

    // Compute the discount server-side — never trust the client
    const subtotalNum = Number(subtotal) || 0;
    let discount =
      coupon.type === "percent"
        ? Math.round((subtotalNum * Number(coupon.value)) / 100)
        : Number(coupon.value);

    if (coupon.max_discount != null) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
    discount = Math.max(0, Math.min(discount, subtotalNum));

    res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
    });
  } catch (err) {
    console.error("Coupon validate error:", err);
    res.status(500).json({ valid: false, message: "Server error" });
  }
});

module.exports = router;