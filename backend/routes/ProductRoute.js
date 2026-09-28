const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

/* --------------------------------------------------------------
   Multer wrapper — converts Multer errors into clean 400 responses
   instead of crashing the server with "Unhandled error"
   -------------------------------------------------------------- */
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
router.get("/:id", productController.getProductById);

/* ─── Admin-only ─── */
router.post(
  "/",
  protect,
  adminOnly,
  uploadSingle("image"),
  productController.createProduct
);

/* ➕ Add a single variant (pure append) */
router.post(
  "/:id/variants",
  protect,
  adminOnly,
  productController.addVariant
);

/* 🗑️ Remove a single variant by index */
router.delete(
  "/:id/variants/:index",
  protect,
  adminOnly,
  productController.removeVariant
);

/* ✏️ Full product update (also used by the frontend to add/remove variants) */
router.put(
  "/:id",
  protect,
  adminOnly,
  uploadSingle("image"),
  productController.updateProduct
);

/* 🗑️ Soft-delete the product */
router.delete("/:id", protect, adminOnly, productController.deleteProduct);

module.exports = router;