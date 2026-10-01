const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

const uploadSingle = (field) => (req, res, next) => {
  upload.single(field)(req, res, (err) => {
    if (err) {
      console.error("❌ Upload rejected:", err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

/* ─── Public ─── */
router.get("/", productController.getAllProducts);

// ⭐ MUST come before "/:id"
router.get("/low-stock", productController.getLowStockProducts);

router.get("/:id", productController.getProductById);

/* ─── Admin-only ─── */
router.post(
  "/",
  protect,
  adminOnly,
  uploadSingle("image"),
  productController.createProduct
);

router.post(
  "/:id/variants",
  protect,
  adminOnly,
  productController.addVariant
);

router.delete(
  "/:id/variants/:index",
  protect,
  adminOnly,
  productController.removeVariant
);

router.put(
  "/:id",
  protect,
  adminOnly,
  uploadSingle("image"),
  productController.updateProduct
);

router.delete("/:id", protect, adminOnly, productController.deleteProduct);

module.exports = router;