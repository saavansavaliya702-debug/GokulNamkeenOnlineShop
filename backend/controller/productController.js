"use strict";

const { AddProduct } = require("../models");
const { Op } = require("sequelize");

/* ──────────────────────────────────────────────
   GET /api/products   (public)
   ────────────────────────────────────────────── */
exports.getAllProducts = async (req, res) => {
  try {
    const products = await AddProduct.findAll({
      where: { is_delete: false },
      order: [["createdAt", "DESC"]],
    });
    res.json(products);
  } catch (err) {
    console.error("getAllProducts:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/* ──────────────────────────────────────────────
   GET /api/products/low-stock   (public or admin)
   Returns products where stock <= low_stock_alert
   ────────────────────────────────────────────── */
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await AddProduct.findAll({
      where: { is_delete: false, is_active: true },
      order: [["stock", "ASC"]],
    });

    const lowStock = products.filter((p) => {
      const stock = Number(p.stock) || 0;
      const alert = Number(p.low_stock_alert ?? 5);
      return stock <= alert;
    });

    console.log(
      `📦 Low-stock check: ${lowStock.length} of ${products.length} products`
    );

    res.json(lowStock);
  } catch (err) {
    console.error("getLowStockProducts:", err);
    res.status(500).json({ error: "Failed to fetch low stock products" });
  }
};

/* ──────────────────────────────────────────────
   GET /api/products/:id   (public)
   ────────────────────────────────────────────── */
exports.getProductById = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    console.error("getProductById:", err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

/* ──────────────────────────────────────────────
   POST /api/products   (admin)
   ────────────────────────────────────────────── */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      stock,
      low_stock_alert, // 👈 NEW
      category,
      weight,
      weightUnit,
      pcs,
      variants,
      description,
      imageUrl,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Product name is required" });
    }

    // Parse variants safely (may arrive as JSON string via multipart form)
    let parsedVariants = [];
    if (variants) {
      try {
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch {
        parsedVariants = [];
      }
    }

    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : imageUrl || null;

    const product = await AddProduct.create({
      name: name.trim(),
      price: price !== undefined && price !== "" ? Number(price) : null,
      stock: Number(stock) || 0,
      low_stock_alert:
        low_stock_alert !== undefined && low_stock_alert !== ""
          ? Number(low_stock_alert)
          : 5,
      category: category || null,
      weight: weight ? Number(weight) : null,
      weightUnit: weightUnit || "g",
      pcs: Number(pcs) || 0,
      variants: parsedVariants,
      description: description || null,
      image: imagePath,
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("createProduct:", err);
    res.status(500).json({ error: err.message || "Failed to add product" });
  }
};

/* ──────────────────────────────────────────────
   PUT /api/products/:id   (admin)
   ────────────────────────────────────────────── */
exports.updateProduct = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const {
      name,
      price,
      stock,
      low_stock_alert, // 👈 NEW
      category,
      weight,
      weightUnit,
      pcs,
      variants,
      description,
      imageUrl,
      is_active,
    } = req.body;

    let parsedVariants = product.variants;
    if (variants !== undefined) {
      try {
        parsedVariants =
          typeof variants === "string" ? JSON.parse(variants) : variants;
      } catch {
        parsedVariants = product.variants;
      }
    }

    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : imageUrl || product.image;

    await product.update({
      name: name !== undefined ? name.trim() : product.name,
      price:
        price !== undefined && price !== ""
          ? Number(price)
          : product.price,
      stock: stock !== undefined ? Number(stock) : product.stock,
      low_stock_alert:
        low_stock_alert !== undefined && low_stock_alert !== ""
          ? Number(low_stock_alert)
          : product.low_stock_alert,
      category: category !== undefined ? category : product.category,
      weight:
        weight !== undefined && weight !== ""
          ? Number(weight)
          : product.weight,
      weightUnit: weightUnit || product.weightUnit,
      pcs: pcs !== undefined ? Number(pcs) : product.pcs,
      variants: parsedVariants,
      description:
        description !== undefined ? description : product.description,
      image: imagePath,
      is_active:
        is_active !== undefined ? Boolean(is_active) : product.is_active,
    });

    res.json(product);
  } catch (err) {
    console.error("updateProduct:", err);
    res.status(500).json({ error: err.message || "Failed to update product" });
  }
};

/* ──────────────────────────────────────────────
   DELETE /api/products/:id   (admin, soft delete)
   ────────────────────────────────────────────── */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    await product.update({ is_delete: true });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
};

/* ──────────────────────────────────────────────
   POST /api/products/:id/variants   (admin)
   ────────────────────────────────────────────── */
exports.addVariant = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const variant = req.body;
    const variants = Array.isArray(product.variants)
      ? [...product.variants]
      : [];
    variants.push(variant);

    await product.update({ variants });
    res.json(product);
  } catch (err) {
    console.error("addVariant:", err);
    res.status(500).json({ error: "Failed to add variant" });
  }
};

/* ──────────────────────────────────────────────
   DELETE /api/products/:id/variants/:index   (admin)
   ────────────────────────────────────────────── */
exports.removeVariant = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const idx = Number(req.params.index);
    const variants = Array.isArray(product.variants)
      ? [...product.variants]
      : [];

    if (idx < 0 || idx >= variants.length) {
      return res.status(400).json({ error: "Invalid variant index" });
    }

    variants.splice(idx, 1);
    await product.update({ variants });
    res.json(product);
  } catch (err) {
    console.error("removeVariant:", err);
    res.status(500).json({ error: "Failed to remove variant" });
  }
};