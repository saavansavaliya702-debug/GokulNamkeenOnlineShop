const { AddProduct } = require("../models");

/**
 * Reduce stock for each item in the order.
 * items: array of { id, name, qty/quantity, price, weight, weightUnit, pcs, ... }
 */
async function reduceStockForOrder(order) {
  if (!order || !Array.isArray(order.items)) return;

  for (const line of order.items) {
    const productId = line.id ?? line.productId;
    if (!productId) continue;

    const product = await AddProduct.findByPk(productId);
    if (!product) continue;

    const orderedQty = Number(line.qty ?? line.quantity ?? 1) || 1;  

    /* ─── Update the per-variant stock if applicable ─── */
    const variants = Array.isArray(product.variants) ? product.variants : [];

    if (variants.length > 0) {
      const updatedVariants = variants.map((v) => {
        const sameWeight =
          String(v.weight ?? "") === String(line.weight ?? "");
        const sameUnit =
          String(v.weightUnit ?? "") === String(line.weightUnit ?? "");
        const samePcs =
          Number(v.pcs ?? 0) === Number(line.pcs ?? 0);

        if (sameWeight && sameUnit && samePcs) {
          const current = Number(v.stock ?? 0);
          return { ...v, stock: Math.max(0, current - orderedQty) };
        }
        return v;
      });

      /* ─── Recompute product-level stock from variants ─── */
      const newTotalStock = updatedVariants.reduce(
        (s, v) => s + (Number(v.stock) || 0),
        0
      );

      await product.update({
        variants: updatedVariants,
        stock: newTotalStock,
      });
    } else {
      /* ─── No variants — just reduce top-level stock ─── */
      const current = Number(product.stock ?? 0);
      await product.update({
        stock: Math.max(0, current - orderedQty),
      });
    }
  }
}

module.exports = { reduceStockForOrder, /* ...other exports */ };