"use strict";

const {
  AddProduct,
  NutritionsDatabase,
  IngredientsDatabase,
  StorageInstructionsDatabase,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

const nutritionFields = [
  "energy_kcal",
  "protein_g",
  "carbohydrates_g",
  "total_fat_g",
  "saturated_fat_g",
  "dietary_fiber_g",
  "sodium_mg",
  "sugar_g",
];

const parseJsonField = (value, fieldName) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${fieldName} must be valid JSON`);
  }
};

const getProductDetails = (body) => {
  const nutrition = body.nutrition === undefined
    ? undefined
    : parseJsonField(body.nutrition, "nutrition");
  const ingredients = body.ingredients === undefined
    ? undefined
    : parseJsonField(body.ingredients, "ingredients");
  const storageInstructions = body.storageInstructions === undefined
    ? undefined
    : parseJsonField(body.storageInstructions, "storageInstructions");

  if (
    nutrition !== undefined &&
    nutrition !== null &&
    (typeof nutrition !== "object" || Array.isArray(nutrition))
  ) {
    throw new Error("nutrition must be an object");
  }
  if (ingredients !== undefined && !Array.isArray(ingredients)) {
    throw new Error("ingredients must be an array");
  }
  if (
    storageInstructions !== undefined &&
    !Array.isArray(storageInstructions)
  ) {
    throw new Error("storageInstructions must be an array");
  }

  let normalizedNutrition = nutrition === undefined ? undefined : null;
  if (nutrition && Object.keys(nutrition).length > 0) {
    const unknownFields = Object.keys(nutrition).filter(
      (field) => !nutritionFields.includes(field),
    );
    if (unknownFields.length > 0) {
      throw new Error(`Unknown nutrition field: ${unknownFields[0]}`);
    }
    if (nutritionFields.some((field) => nutrition[field] === undefined)) {
      throw new Error("Provide a value for every nutrition field");
    }
    normalizedNutrition = Object.fromEntries(
      nutritionFields.map((field) => {
        const value = nutrition[field];
        const number = Number(value);
        if (
          value === "" ||
          value === null ||
          !Number.isFinite(number) ||
          number < 0
        ) {
          throw new Error(`${field} must be a non-negative number`);
        }
        return [field, number];
      }),
    );
  }

  const normalizedIngredients = ingredients === undefined
    ? undefined
    : ingredients
    .map((ingredient) =>
      typeof ingredient === "string"
        ? { name: ingredient.trim() }
        : { ...ingredient, name: String(ingredient?.name || "").trim() },
    )
    .filter((ingredient) => ingredient.name)
    .map((ingredient, sort_order) => ({ ...ingredient, sort_order }));

  const normalizedStorageInstructions = storageInstructions === undefined
    ? undefined
    : storageInstructions
    .map((instruction) => ({
      icon: String(instruction?.icon || "").trim() || null,
      title: String(instruction?.title || "").trim(),
      description: String(instruction?.description || "").trim(),
    }))
    .filter((instruction) => instruction.title || instruction.description)
    .map((instruction, sort_order) => {
      if (!instruction.title || !instruction.description) {
        throw new Error("Each storage instruction requires a title and description");
      }
      return { ...instruction, sort_order };
    });

  return {
    nutrition: normalizedNutrition,
    ingredients: normalizedIngredients,
    storageInstructions: normalizedStorageInstructions,
  };
};

const saveProductDetails = async (product, details, transaction) => {
  if (details.nutrition !== undefined) {
    await NutritionsDatabase.destroy({
      where: { product_id: product.id },
      transaction,
    });
    if (details.nutrition) {
      await NutritionsDatabase.create(
        { ...details.nutrition, product_id: product.id },
        { transaction },
      );
    }
  }

  if (details.ingredients !== undefined) {
    await IngredientsDatabase.destroy({
      where: { product_id: product.id },
      transaction,
    });
    if (details.ingredients.length) {
      await IngredientsDatabase.bulkCreate(
        details.ingredients.map((ingredient) => ({
          ...ingredient,
          product_id: product.id,
        })),
        { transaction },
      );
    }
  }

  if (details.storageInstructions !== undefined) {
    await StorageInstructionsDatabase.destroy({
      where: { product_id: product.id },
      transaction,
    });
    if (details.storageInstructions.length) {
      await StorageInstructionsDatabase.bulkCreate(
        details.storageInstructions.map((instruction) => ({
          ...instruction,
          product_id: product.id,
        })),
        { transaction },
      );
    }
  }
};

const productDetailsIncludes = [
  { model: NutritionsDatabase, as: "nutrition" },
  {
    model: IngredientsDatabase,
    as: "ingredients",
    separate: true,
    order: [["sort_order", "ASC"]],
  },
  {
    model: StorageInstructionsDatabase,
    as: "storageInstructions",
    separate: true,
    order: [["sort_order", "ASC"]],
  },
];

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
      include: productDetailsIncludes,
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
      nutrition,
      ingredients,
      storageInstructions,
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

    const details = getProductDetails({
      nutrition,
      ingredients,
      storageInstructions,
    });
    const product = await sequelize.transaction(async (transaction) => {
      const createdProduct = await AddProduct.create(
        {
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
        },
        { transaction },
      );
      await saveProductDetails(createdProduct, details, transaction);
      return createdProduct;
    });

    const savedProduct = await AddProduct.findByPk(product.id, {
      include: productDetailsIncludes,
    });
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("createProduct:", err);
    const invalidDetails =
      err.message?.includes("must be") ||
      err.message?.includes("requires a title") ||
      err.message?.includes("Unknown nutrition field") ||
      err.message?.includes("Provide a value") ||
      err.message?.includes("valid JSON");
    res
      .status(invalidDetails ? 400 : 500)
      .json({ error: err.message || "Failed to add product" });
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
      nutrition,
      ingredients,
      storageInstructions,
    } = req.body;

    const details = getProductDetails({
      nutrition,
      ingredients,
      storageInstructions,
    });
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

    await sequelize.transaction(async (transaction) => {
      await product.update(
        {
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
        },
        { transaction },
      );
      await saveProductDetails(product, details, transaction);
    });

    const savedProduct = await AddProduct.findByPk(product.id, {
      include: productDetailsIncludes,
    });
    res.json(savedProduct);
  } catch (err) {
    console.error("updateProduct:", err);
    const invalidDetails =
      err.message?.includes("must be") ||
      err.message?.includes("requires a title") ||
      err.message?.includes("Unknown nutrition field") ||
      err.message?.includes("Provide a value") ||
      err.message?.includes("valid JSON");
    res
      .status(invalidDetails ? 400 : 500)
      .json({ error: err.message || "Failed to update product" });
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