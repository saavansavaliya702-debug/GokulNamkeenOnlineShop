// backend/controller/productController.js
const { AddProduct } = require("../models");

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */
function parseVariants(raw) {
  if (!raw) return [];
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];

  return arr
    .map((v) => ({
      weight: v.weight !== "" && v.weight != null ? Number(v.weight) : null,
      weightUnit: v.weightUnit || "g",
      price: v.price !== "" && v.price != null ? Number(v.price) : null,
      stock: v.stock !== "" && v.stock != null ? Number(v.stock) : 0,
      pcs: v.pcs !== "" && v.pcs != null ? Number(v.pcs) : 0,
    }))
    .filter((v) => v.weight != null && v.price != null);
}

function pickHeadline(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null;
  return variants[variants.length - 1];
}

function legacyFieldsFromVariants(variants) {
  const head = pickHeadline(variants);
  const totalStock = Array.isArray(variants)
    ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
    : 0;

  if (!head) {
    return {
      price: null,
      weight: null,
      weightUnit: "g",
      stock: totalStock,
      pcs: 0,
    };
  }
  return {
    price: head.price ?? null,
    weight: head.weight ?? null,
    weightUnit: head.weightUnit ?? "g",
    stock: totalStock,
    pcs: head.pcs ?? 0,
  };
}

/* ═══════════════════════════════════════════
   GET ALL
   ═══════════════════════════════════════════ */
exports.getAllProducts = async (req, res) => {
  try {
    const where =
      req.query.all === "true"
        ? { is_delete: false }                   // admin: all non-deleted
        : { is_delete: false, is_active: true }; // customers: only active

    const products = await AddProduct.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
    res.json(products);
  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

/* ═══════════════════════════════════════════
   GET ONE
   ═══════════════════════════════════════════ */
exports.getProductById = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    console.error("getProductById error:", err);
    res.status(500).json({ message: "Failed" });
  }
};

/* ═══════════════════════════════════════════
   CREATE
   ═══════════════════════════════════════════ */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      stock,
      imageUrl,
      price,
      weight,
      weightUnit,
      pcs,
      is_active,
    } = req.body;

    const variants = parseVariants(req.body.variants);

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    /* Image */
    let finalImage = "";
    if (req.file) {
      finalImage = "/uploads/" + req.file.filename;
    } else if (imageUrl) {
      if (imageUrl.startsWith("data:")) {
        return res.status(400).json({ message: "Base64 not allowed" });
      }
      finalImage = imageUrl;
    }

    /* Headline variant */
    const head = pickHeadline(variants);
    const finalPrice = head?.price ?? (price ? Number(price) : null);
    const finalWeight = head?.weight ?? (weight ? Number(weight) : null);
    const finalWeightUnit = head?.weightUnit ?? weightUnit ?? "g";
    const finalPcs = head?.pcs ?? (pcs != null && pcs !== "" ? Number(pcs) : 0);

    /* If no variants, synthesize one from top-level fields */
    let finalVariants = variants;
    if (
      finalVariants.length === 0 &&
      (finalPrice != null || finalWeight != null)
    ) {
      finalVariants = [
        {
          weight: finalWeight,
          weightUnit: finalWeightUnit,
          price: finalPrice,
          stock: Number(stock) || 0,
          pcs: finalPcs,
        },
      ];
    }

    /* Total stock = sum of variant stocks */
    const totalStock = finalVariants.reduce(
      (s, v) => s + (Number(v.stock) || 0),
      0
    );
    const finalStock = finalVariants.length > 0 ? totalStock : Number(stock) || 0;

    const product = await AddProduct.create({
      name,
      description: description || "",
      category: category || "Namkeen",
      image: finalImage,
      stock: finalStock,
      price: finalPrice,
      weight: finalWeight,
      weightUnit: finalWeightUnit,
      pcs: finalPcs,
      variants: finalVariants,
      is_active: is_active === undefined ? true : Boolean(is_active),
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ message: "Failed to create product" });
  }
};

/* ═══════════════════════════════════════════
   UPDATE
   ═══════════════════════════════════════════ */
exports.updateProduct = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ message: "Not found" });

    const {
      name,
      description,
      category,
      stock,
      imageUrl,
      price,
      weight,
      weightUnit,
      pcs,           // ⭐ NEW
      is_active,     // ⭐ NEW
    } = req.body;

    const payload = {
      name: product.name,
      description: product.description,
      category: product.category,
      stock: product.stock,
      image: product.image,
      variants: product.variants,
      price: product.price,
      weight: product.weight,
      weightUnit: product.weightUnit,
      pcs: product.pcs,
      is_active: product.is_active,
    };

    if (name !== undefined) payload.name = name;
    if (description !== undefined) payload.description = description;
    if (category !== undefined) payload.category = category;

    /* ── Variants ── */
    let variantsTouched = false;
    if (req.body.variants !== undefined) {
      const variants = parseVariants(req.body.variants);
      payload.variants = variants;
      variantsTouched = true;

      const legacy = legacyFieldsFromVariants(variants);
      payload.price = legacy.price;
      payload.weight = legacy.weight;
      payload.weightUnit = legacy.weightUnit;
      payload.stock = legacy.stock;
      payload.pcs = legacy.pcs;
    }

    /* ── Top-level updates (only if variants weren't sent) ── */
    if (!variantsTouched) {
      if (stock !== undefined && stock !== "" && !Number.isNaN(Number(stock))) {
        payload.stock = Number(stock);
      }
      if (price !== undefined && price !== "") payload.price = Number(price);
      if (weight !== undefined && weight !== "") payload.weight = Number(weight);
      if (weightUnit !== undefined) payload.weightUnit = weightUnit;
      if (pcs !== undefined && pcs !== "") payload.pcs = Number(pcs);
    }

    /* ⭐ is_active can always be set (independent of variants) */
    if (is_active !== undefined) {
      payload.is_active = Boolean(is_active);
    }

    /* ── Image ── */
    if (req.file) {
      payload.image = "/uploads/" + req.file.filename;
    } else if (imageUrl !== undefined) {
      payload.image = imageUrl;
    }

    await AddProduct.update(payload, { where: { id: product.id } });
    const fresh = await AddProduct.findByPk(product.id);
    res.json(fresh);
  } catch (err) {
    console.error("updateProduct error:", err);
    res.status(500).json({ message: "Failed to update" });
  }
};

/* ═══════════════════════════════════════════
   DELETE (soft)
   ═══════════════════════════════════════════ */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await AddProduct.findOne({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ message: "Not found" });

    await AddProduct.update({ is_delete: true }, { where: { id: product.id } });
    const fresh = await AddProduct.findByPk(product.id);
    res.json({ message: "Deleted", product: fresh });
  } catch (err) {
    console.error("deleteProduct error:", err);
    res.status(500).json({ message: "Failed to delete" });
  }
};

/* ═══════════════════════════════════════════
   ADD SINGLE VARIANT
   ═══════════════════════════════════════════ */
exports.addVariant = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const { weight, weightUnit = "g", price, stock, pcs } = req.body;

    if (weight === "" || weight == null || price === "" || price == null) {
      return res.status(400).json({ message: "Weight and price are required" });
    }

    let existing = Array.isArray(product.variants) ? [...product.variants] : [];

    if (existing.length === 0 && product.price != null) {
      existing = [
        {
          weight: product.weight ?? null,
          weightUnit: product.weightUnit ?? "g",
          price: product.price,
          stock: product.stock ?? 0,
          pcs: product.pcs ?? 0,
        },
      ];
    }

    const updated = [
      ...existing,
      {
        weight: Number(weight),
        weightUnit,
        price: Number(price),
        stock: Number(stock) || 0,
        pcs: pcs != null && pcs !== "" ? Number(pcs) : 0,
      },
    ];

    const legacy = legacyFieldsFromVariants(updated);

    await AddProduct.update(
      {
        variants: updated,
        price: legacy.price,
        weight: legacy.weight,
        weightUnit: legacy.weightUnit,
        stock: legacy.stock,
        pcs: legacy.pcs,
      },
      { where: { id: product.id } }
    );

    const fresh = await AddProduct.findByPk(product.id);
    res.status(201).json(fresh);
  } catch (err) {
    console.error("addVariant error:", err);
    res.status(500).json({ message: "Failed to add variant" });
  }
};

/* ═══════════════════════════════════════════
   REMOVE SINGLE VARIANT BY INDEX
   ═══════════════════════════════════════════ */
exports.removeVariant = async (req, res) => {
  try {
    const product = await AddProduct.findOne({
      where: { id: req.params.id, is_delete: false },
    });
    if (!product) return res.status(404).json({ message: "Product not found" });

    const idx = Number(req.params.index);
    const existing = Array.isArray(product.variants) ? product.variants : [];

    if (idx < 0 || idx >= existing.length) {
      return res.status(400).json({ message: "Invalid variant index" });
    }

    const updated = existing.filter((_, i) => i !== idx);
    const legacy = legacyFieldsFromVariants(updated);

    await AddProduct.update(
      {
        variants: updated,
        price: legacy.price,
        weight: legacy.weight,
        weightUnit: legacy.weightUnit,
        stock: legacy.stock,
        pcs: legacy.pcs,
      },
      { where: { id: product.id } }
    );

    const fresh = await AddProduct.findByPk(product.id);
    res.json(fresh);
  } catch (err) {
    console.error("removeVariant error:", err);
    res.status(500).json({ message: "Failed to remove variant" });
  }
};