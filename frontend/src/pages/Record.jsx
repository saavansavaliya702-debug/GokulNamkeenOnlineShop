// src/pages/Record.jsx
import { Fragment, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import { getImageUrl } from "../utils/image";
import "../Css/Record.css";

const Record = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | inactive | low

  // ---- Add-variant state ----
  const [openFor, setOpenFor] = useState(null);
  const [newWeight, setNewWeight] = useState("");
  const [newUnit, setNewUnit] = useState("g");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPcs, setNewPcs] = useState("");
  const [saving, setSaving] = useState(false);

  // ---- Edit-product state ----
  const [editFor, setEditFor] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLowStockAlert, setEditLowStockAlert] = useState("5");
  const [editVariants, setEditVariants] = useState([]);
  const [editSaving, setEditSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products?all=true");
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  const toggleActive = async (product) => {
    const next = !(product.is_active ?? true);
    const prev = products;

    setProducts((list) =>
      list.map((p) => (p.id === product.id ? { ...p, is_active: next } : p))
    );

    try {
      const { data } = await api.put(`/products/${product.id}`, {
        is_active: next,
      });
      setProducts((list) =>
        list.map((p) => (p.id === product.id ? data : p))
      );
      toast.success(next ? "Product activated" : "Product deactivated");
    } catch (err) {
      setProducts(prev);
      toast.error(err.response?.data?.message || "Failed to update");
    }
  };

  const openEditor = (id) => {
    setOpenFor(id);
    setNewWeight("");
    setNewUnit("g");
    setNewPrice("");
    setNewStock("");
    setNewPcs("");
  };

  const closeEditor = () => {
    setOpenFor(null);
    setNewWeight("");
    setNewUnit("g");
    setNewPrice("");
    setNewStock("");
    setNewPcs("");
  };

  const saveVariant = async (product) => {
    if (newWeight === "" || newPrice === "") {
      toast.error("Enter both weight and price");
      return;
    }

    setSaving(true);

    const existing = Array.isArray(product.variants)
      ? product.variants
      : product.weight != null && product.price != null
      ? [
          {
            weight: product.weight,
            weightUnit: product.weightUnit || "g",
            price: product.price,
            stock: product.stock || 0,
            pcs: product.pcs ?? 0,
          },
        ]
      : [];

    const newVariant = {
      weight: Number(newWeight),
      weightUnit: newUnit,
      price: Number(newPrice),
      stock: newStock === "" ? 0 : Number(newStock),
      pcs: newPcs === "" ? 0 : Number(newPcs),
    };

    const updatedVariants = [...existing, newVariant];

    try {
      const { data } = await api.put(`/products/${product.id}`, {
        variants: updatedVariants,
      });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? data : p))
      );
      toast.success("Variant added");
      closeEditor();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const removeVariant = async (product, idx) => {
    const existing = Array.isArray(product.variants) ? product.variants : [];
    const updated = existing.filter((_, i) => i !== idx);

    try {
      const { data } = await api.put(`/products/${product.id}`, {
        variants: updated,
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? data : p)));
      toast.success("Variant removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  // ---- Edit product handlers ----
  const openEdit = (product) => {
    setEditFor(product.id);
    setEditName(product.name || "");
    setEditCategory(product.category || "");
    setEditLowStockAlert(
      product.low_stock_alert != null ? String(product.low_stock_alert) : "5"
    );
    setEditVariants(
      getVariants(product).map((v) => ({
        weight: v.weight,
        weightUnit: v.weightUnit || "g",
        price: v.price,
        stock: v.stock ?? 0,
        pcs: v.pcs ?? 0,
      }))
    );
  };

  const closeEdit = () => {
    setEditFor(null);
    setEditName("");
    setEditCategory("");
    setEditLowStockAlert("5");
    setEditVariants([]);
  };

  const updateEditVariantField = (idx, field, value) => {
    setEditVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  const addEditVariantRow = () => {
    setEditVariants((prev) => [
      ...prev,
      { weight: "", weightUnit: "g", price: "", stock: 0, pcs: 0 },
    ]);
  };

  const removeEditVariantRow = (idx) => {
    setEditVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveEdit = async (product) => {
    if (!editName.trim()) {
      toast.error("Product name is required");
      return;
    }

    if (editLowStockAlert !== "" && Number(editLowStockAlert) < 0) {
      toast.error("Low stock alert must be 0 or greater");
      return;
    }

    for (let i = 0; i < editVariants.length; i++) {
      const v = editVariants[i];
      if (v.weight === "" || v.price === "") {
        toast.error(`Variant ${i + 1}: weight and price required`);
        return;
      }
    }

    setEditSaving(true);

    const payload = {
      name: editName.trim(),
      category: editCategory.trim(),
      low_stock_alert:
        editLowStockAlert === "" ? 5 : Number(editLowStockAlert),
      variants: editVariants.map((v) => ({
        weight: Number(v.weight),
        weightUnit: v.weightUnit || "g",
        price: Number(v.price),
        stock: v.stock === "" ? 0 : Number(v.stock),
        pcs: v.pcs === "" ? 0 : Number(v.pcs),
      })),
    };

    try {
      const { data } = await api.put(`/products/${product.id}`, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? data : p))
      );
      toast.success("Product updated");
      closeEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setEditSaving(false);
    }
  };

  const getVariants = (p) => {
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.map((v) => ({
        weight: v.weight,
        weightUnit: v.weightUnit || "g",
        price: v.price,
        stock: v.stock ?? 0,
        pcs: v.pcs ?? 0,
      }));
    }
    if (p.weight != null && p.price != null) {
      return [
        {
          weight: p.weight,
          weightUnit: p.weightUnit || "g",
          price: p.price,
          stock: p.stock ?? 0,
          pcs: p.pcs ?? 0,
        },
      ];
    }
    return [];
  };

  const getTotalStock = (p) => {
    const variants = getVariants(p);
    return variants.length
      ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
      : p.stock || 0;
  };

  const getAlertLevel = (p) => Number(p.low_stock_alert ?? 5);

  const isLowStock = (p) => {
    const s = getTotalStock(p);
    return s > 0 && s <= getAlertLevel(p);
  };

  const isOutOfStock = (p) => getTotalStock(p) === 0;

  /* ⭐ NEW — Row click handler */
  const handleRowClick = (product, isEditing) => {
    // If already editing this row, close it
    if (isEditing) {
      closeEdit();
      return;
    }
    // Otherwise open the edit panel
    openEdit(product);
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (!matchesSearch) return false;

    const isActive = p.is_active ?? true;

    if (filter === "active") return isActive;
    if (filter === "inactive") return !isActive;
    if (filter === "low") return isLowStock(p);
    return true;
  });

  const stats = {
    total: products.length,
    active: products.filter((p) => p.is_active ?? true).length,
    inactive: products.filter((p) => !(p.is_active ?? true)).length,
    low: products.filter(isLowStock).length,
  };

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="record-page">
        <div className="record-container">
          {/* Header */}
          <header className="record-header">
            <div className="record-header-left">
              <div className="record-header-icon">📋</div>
              <div>
                <h1>Product Records</h1>
                <p>
                  {loading
                    ? "Loading..."
                    : `${products.length} product${
                        products.length !== 1 ? "s" : ""
                      } in your store`}
                </p>
              </div>
            </div>

            <div className="record-search">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="search-clear"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          </header>

          {/* Filters */}
          {!loading && (
            <div className="record-filters">
              {[
                { key: "all", label: "All", count: stats.total },
                { key: "active", label: "Active", count: stats.active },
                { key: "inactive", label: "Inactive", count: stats.inactive },
                { key: "low", label: "Low Stock", count: stats.low },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`filter-chip ${filter === f.key ? "active" : ""}`}
                  onClick={() => setFilter(f.key)}
                  type="button"
                >
                  {f.label}
                  <span className="filter-count">{f.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="record-loading">
              <div className="record-spinner" />
              <p>Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="record-empty">
              <div className="empty-icon">📦</div>
              <h3>
                {search || filter !== "all"
                  ? "No matching products"
                  : "No products yet"}
              </h3>
              <p>
                {search
                  ? "Try a different search term."
                  : filter !== "all"
                  ? "No products match this filter."
                  : "Add your first product to see it here."}
              </p>
            </div>
          ) : (
            <div className="record-table-wrap">
              <table className="record-table">
                <thead>
                  <tr>
                    <th className="col-image">Image</th>
                    <th className="col-name">Product</th>
                    <th className="col-variants">Variants</th>
                    <th className="col-stock">Stock</th>
                    <th className="col-status">Status</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const variants = getVariants(p);
                    const isOpen = openFor === p.id;
                    const isEditing = editFor === p.id;
                    const isActive = p.is_active ?? true;
                    const totalStock = getTotalStock(p);

                    return (
                      <Fragment key={p.id}>
                        {/* ⭐ Main product row — clickable */}
                        <tr
                          className={`record-row-clickable ${
                            !isActive ? "row-inactive" : ""
                          } ${isEditing ? "row-editing is-selected" : ""}`}
                          onClick={() => handleRowClick(p, isEditing)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRowClick(p, isEditing);
                            }
                          }}
                          title={
                            isEditing
                              ? "Click to close editor"
                              : "Click to edit this product"
                          }
                        >
                          <td className="col-image">
                            <div className="record-thumb">
                              {p.image ? (
                                <img
                                  src={getImageUrl(p.image)}
                                  alt={p.name}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.parentNode.classList.add("no-img");
                                    e.target.parentNode.textContent = "🌾";
                                  }}
                                />
                              ) : (
                                "🌾"
                              )}
                            </div>
                          </td>

                          <td className="col-name">
                            <div className="product-name">{p.name}</div>
                            {p.category && (
                              <span className="product-cat">{p.category}</span>
                            )}
                          </td>

                          <td className="col-variants">
                            {variants.length === 0 ? (
                              <span className="no-variants">No variants</span>
                            ) : (
                              <div className="variants-list">
                                {variants.map((v, idx) => (
                                  <div className="variant-chip" key={idx}>
                                    <span className="v-weight">
                                      {v.weight}
                                      {v.weightUnit || "g"}
                                    </span>
                                    {v.pcs > 0 && (
                                      <span className="v-pcs">
                                        · {v.pcs} pcs
                                      </span>
                                    )}
                                    <span className="v-price">₹{v.price}</span>
                                    <span className="v-stock">
                                      · {v.stock} left
                                    </span>
                                    <button
                                      className="v-remove"
                                      onClick={(e) => {
                                        e.stopPropagation(); // ⭐ don't trigger row click
                                        removeVariant(p, idx);
                                      }}
                                      title="Remove variant"
                                      type="button"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          <td className="col-stock">
                            <span
                              className={`stock-badge ${
                                isOutOfStock(p)
                                  ? "out"
                                  : isLowStock(p)
                                  ? "low"
                                  : "in"
                              }`}
                            >
                              {isOutOfStock(p)
                                ? "Out of stock"
                                : `${totalStock} units`}
                              {isLowStock(p) && (
                                <small
                                  style={{
                                    opacity: 0.7,
                                    marginLeft: 6,
                                    fontWeight: 500,
                                  }}
                                >
                                  (≤ {getAlertLevel(p)})
                                </small>
                              )}
                            </span>
                          </td>

                          <td className="col-status">
                            <button
                              className={`status-toggle ${
                                isActive ? "on" : "off"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation(); // ⭐ don't trigger row click
                                toggleActive(p);
                              }}
                              title={
                                isActive
                                  ? "Click to deactivate"
                                  : "Click to activate"
                              }
                              type="button"
                            >
                              <span className="toggle-track">
                                <span className="toggle-thumb" />
                              </span>
                              <span className="toggle-label">
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </button>
                          </td>

                          <td className="col-actions">
                            <div className="action-btns">
                              <button
                                className="btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation(); // ⭐ don't trigger row click
                                  isEditing ? closeEdit() : openEdit(p);
                                }}
                                type="button"
                                title="Edit product"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn-variant"
                                onClick={(e) => {
                                  e.stopPropagation(); // ⭐ don't trigger row click
                                  openEditor(p.id);
                                }}
                                type="button"
                              >
                                ➕ Variant
                              </button>
                              <button
                                className="btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation(); // ⭐ don't trigger row click
                                  handleDelete(p.id);
                                }}
                                title="Delete product"
                                type="button"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ---- Edit product row ---- */}
                        {isEditing && (
                          <tr className="editor-row edit-row">
                            <td colSpan={6}>
                              <div
                                className="variant-editor edit-editor"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h4>✏️ Editing: {p.name}</h4>

                                <div className="edit-meta">
                                  <div className="editor-field">
                                    <label>Product Name</label>
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) =>
                                        setEditName(e.target.value)
                                      }
                                      placeholder="Product name"
                                    />
                                  </div>
                                  <div className="editor-field">
                                    <label>Category</label>
                                    <input
                                      type="text"
                                      value={editCategory}
                                      onChange={(e) =>
                                        setEditCategory(e.target.value)
                                      }
                                      placeholder="e.g. Grains"
                                    />
                                  </div>

                                  <div className="editor-field">
                                    <label>⚠️ Low Stock Alert</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={editLowStockAlert}
                                      onChange={(e) =>
                                        setEditLowStockAlert(e.target.value)
                                      }
                                      placeholder="5"
                                    />
                                    <small className="field-hint">
                                      Alert when total stock drops to this
                                      number or below.
                                    </small>
                                  </div>
                                </div>

                                <div className="edit-variants-header">
                                  <span>Variants</span>
                                  <button
                                    type="button"
                                    className="btn-add-row"
                                    onClick={addEditVariantRow}
                                  >
                                    ➕ Add row
                                  </button>
                                </div>

                                {editVariants.length === 0 ? (
                                  <p className="edit-no-variants">
                                    No variants. Click "Add row" to create one.
                                  </p>
                                ) : (
                                  <div className="edit-variants-list">
                                    {editVariants.map((v, idx) => (
                                      <div
                                        className="edit-variant-row"
                                        key={idx}
                                      >
                                        <div className="editor-field small">
                                          <label>Weight</label>
                                          <input
                                            type="number"
                                            value={v.weight}
                                            onChange={(e) =>
                                              updateEditVariantField(
                                                idx,
                                                "weight",
                                                e.target.value
                                              )
                                            }
                                            placeholder="500"
                                          />
                                        </div>
                                        <div className="editor-field small">
                                          <label>Unit</label>
                                          <select
                                            value={v.weightUnit}
                                            onChange={(e) =>
                                              updateEditVariantField(
                                                idx,
                                                "weightUnit",
                                                e.target.value
                                              )
                                            }
                                          >
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                            <option value="ml">ml</option>
                                            <option value="l">l</option>
                                            <option value="pcs">pcs</option>
                                          </select>
                                        </div>
                                        <div className="editor-field small">
                                          <label>Price (₹)</label>
                                          <input
                                            type="number"
                                            value={v.price}
                                            onChange={(e) =>
                                              updateEditVariantField(
                                                idx,
                                                "price",
                                                e.target.value
                                              )
                                            }
                                            placeholder="120"
                                          />
                                        </div>
                                        <div className="editor-field small">
                                          <label>Stock</label>
                                          <input
                                            type="number"
                                            value={v.stock}
                                            onChange={(e) =>
                                              updateEditVariantField(
                                                idx,
                                                "stock",
                                                e.target.value
                                              )
                                            }
                                            placeholder="0"
                                          />
                                        </div>
                                        <div className="editor-field small">
                                          <label>Pcs</label>
                                          <input
                                            type="number"
                                            value={v.pcs}
                                            onChange={(e) =>
                                              updateEditVariantField(
                                                idx,
                                                "pcs",
                                                e.target.value
                                              )
                                            }
                                            placeholder="0"
                                            min="0"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          className="btn-remove-row"
                                          onClick={() =>
                                            removeEditVariantRow(idx)
                                          }
                                          title="Remove this variant"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="editor-actions">
                                  <button
                                    className="btn-save"
                                    onClick={() => saveEdit(p)}
                                    disabled={editSaving}
                                    type="button"
                                  >
                                    {editSaving
                                      ? "Saving..."
                                      : "💾 Save changes"}
                                  </button>
                                  <button
                                    className="btn-cancel"
                                    onClick={closeEdit}
                                    type="button"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* ---- Add-variant row ---- */}
                        {isOpen && (
                          <tr className="editor-row">
                            <td colSpan={6}>
                              <div
                                className="variant-editor"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h4>Add new variant for {p.name}</h4>
                                <div className="editor-fields">
                                  <div className="editor-field">
                                    <label>Weight</label>
                                    <input
                                      type="number"
                                      placeholder="e.g. 500"
                                      value={newWeight}
                                      onChange={(e) =>
                                        setNewWeight(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="editor-field">
                                    <label>Unit</label>
                                    <select
                                      value={newUnit}
                                      onChange={(e) =>
                                        setNewUnit(e.target.value)
                                      }
                                    >
                                      <option value="g">g</option>
                                      <option value="kg">kg</option>
                                      <option value="ml">ml</option>
                                      <option value="l">l</option>
                                      <option value="pcs">pcs</option>
                                    </select>
                                  </div>
                                  <div className="editor-field">
                                    <label>Price (₹)</label>
                                    <input
                                      type="number"
                                      placeholder="e.g. 120"
                                      value={newPrice}
                                      onChange={(e) =>
                                        setNewPrice(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="editor-field">
                                    <label>Stock</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={newStock}
                                      onChange={(e) =>
                                        setNewStock(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="editor-field">
                                    <label>Pcs</label>
                                    <input
                                      type="number"
                                      placeholder="0"
                                      value={newPcs}
                                      onChange={(e) =>
                                        setNewPcs(e.target.value)
                                      }
                                      min="0"
                                    />
                                  </div>
                                  <div className="editor-actions">
                                    <button
                                      className="btn-save"
                                      onClick={() => saveVariant(p)}
                                      disabled={saving}
                                      type="button"
                                    >
                                      {saving ? "Saving..." : "💾 Save"}
                                    </button>
                                    <button
                                      className="btn-cancel"
                                      onClick={closeEditor}
                                      type="button"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Record;