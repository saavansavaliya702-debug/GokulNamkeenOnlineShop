// src/pages/AddProduct.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import "../Css/AddProduct.css";

const CATEGORIES = [
  "Namkeen",
  "Sweets",
  "Snacks",
  "Beverages",
  "Bakery",
];

const WEIGHT_OPTIONS = ["100", "250", "500", "750", "1", "2", "5"];
const UNITS = [
  { value: "g", label: "grams (g)" },
  { value: "kg", label: "kilograms (kg)" },
  { value: "ml", label: "milliliters (ml)" },
  { value: "l", label: "liters (l)" },
  { value: "pcs", label: "pieces (pcs)" },
];

const AddProduct = () => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Namkeen");
  const [stock, setStock] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState("5"); // 👈 NEW
  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState("g");
  const [pcs, setPcs] = useState("");

  const [imageMode, setImageMode] = useState("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setImageMode("file");
      setImageUrl("");
      if (!file.type.startsWith("image/")) {
        toast.error("Please drop an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5 MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    if (url.startsWith("data:")) {
      toast.error("Don't paste base64 — use a real https:// URL or upload a file");
      return;
    }
    setImageUrl(url);
    setImagePreview(url);
  };

  const switchMode = (mode) => {
    setImageMode(mode);
    setImagePreview("");
    if (mode === "url") setImageFile(null);
    else setImageUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    if (!weight) {
      toast.error("Select a weight");
      return;
    }
    if (lowStockAlert !== "" && Number(lowStockAlert) < 0) {
      toast.error("Low stock alert must be 0 or greater");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("pcs", pcs || "0");
    formData.append("price", price);
    formData.append("stock", stock || "0");
    formData.append("low_stock_alert", lowStockAlert || "5"); // 👈 NEW
    formData.append("weight", weight);
    formData.append("weightUnit", weightUnit);

    if (imageMode === "file" && imageFile) {
      formData.append("image", imageFile);
    } else if (imageMode === "url" && imageUrl) {
      formData.append("imageUrl", imageUrl);
    }

    try {
      await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Product added successfully!");

      // Reset
      setName("");
      setPrice("");
      setDescription("");
      setCategory("Namkeen");
      setStock("");
      setLowStockAlert("5"); // 👈 reset to default
      setWeight("");
      setWeightUnit("g");
      setPcs("");
      setImageUrl("");
      setImageFile(null);
      setImagePreview("");
      setImageMode("url");

      setTimeout(() => navigate("/record"), 800);
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to add product";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Is the current stock already at/below the alert level?
  const stockNum = Number(stock || 0);
  const alertNum = Number(lowStockAlert || 0);
  const willBeLowStock =
    stock !== "" && lowStockAlert !== "" && stockNum <= alertNum;

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="ap-page">
        <div className="ap-container">
          {/* Header */}
          <div className="ap-header">
            <button
              className="ap-back"
              onClick={() => navigate(-1)}
              type="button"
            >
              ← Back
            </button>
            <div className="ap-header-main">
              <div className="ap-header-icon">📦</div>
              <div>
                <span className="ap-badge">Admin Panel</span>
                <h1>Add New Product</h1>
                <p>Fill in the details below to add a new item to your store</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="ap-form" noValidate>
            <div className="ap-grid">
              {/* Left: form fields */}
              <div className="ap-main">
                {/* Basic info */}
                <section className="ap-section">
                  <h2 className="ap-section-title">Basic Information</h2>

                  <div className="ap-field">
                    <label htmlFor="name">
                      Product Name <span className="req">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Mathri, Namkeen Mix"
                    />
                  </div>

                  <div className="ap-row">
                    <div className="ap-field">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="ap-field">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Short description of the product..."
                    />
                  </div>
                </section>

                {/* Pricing & inventory */}
                <section className="ap-section">
                  <h2 className="ap-section-title">Pricing & Inventory</h2>

                  <div className="ap-row three">
                    <div className="ap-field">
                      <label htmlFor="price">
                        Price (₹) <span className="req">*</span>
                      </label>
                      <div className="input-prefix">
                        <span>₹</span>
                        <input
                          id="price"
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          required
                          placeholder="149"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div className="ap-field">
                      <label htmlFor="stock">Stock</label>
                      <input
                        id="stock"
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="50"
                        min="0"
                      />
                    </div>

                    <div className="ap-field">
                      <label htmlFor="pcs">Pieces (pcs)</label>
                      <input
                        id="pcs"
                        type="number"
                        value={pcs}
                        onChange={(e) => setPcs(e.target.value)}
                        placeholder="e.g. 1"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* 👇 NEW — Low stock alert field */}
                  <div className="ap-field">
                    <label htmlFor="lowStockAlert">
                      ⚠️ Low Stock Alert Threshold
                    </label>
                    <input
                      id="lowStockAlert"
                      type="number"
                      value={lowStockAlert}
                      onChange={(e) => setLowStockAlert(e.target.value)}
                      placeholder="5"
                      min="0"
                    />
                    <small className="ap-hint">
                      Alert when stock drops to this number or below.
                      Default is 5. Set to 0 to disable alerts.
                    </small>
                  </div>

                  {willBeLowStock && (
                    <div className="ap-inline-warning">
                      ⚠️ Current stock ({stockNum}) is at or below the alert
                      threshold ({alertNum}). This product will appear in the
                      Low Stock section immediately.
                    </div>
                  )}

                  <div className="ap-row">
                    <div className="ap-field">
                      <label htmlFor="weight">
                        Weight <span className="req">*</span>
                      </label>
                      <select
                        id="weight"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        required
                      >
                        <option value="">Select weight</option>
                        {WEIGHT_OPTIONS.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="ap-field">
                      <label htmlFor="weightUnit">Unit</label>
                      <select
                        id="weightUnit"
                        value={weightUnit}
                        onChange={(e) => setWeightUnit(e.target.value)}
                      >
                        {UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right: image + summary */}
              <div className="ap-side">
                <section className="ap-section">
                  <h2 className="ap-section-title">Product Image</h2>

                  <div className="image-mode-tabs">
                    <button
                      type="button"
                      className={`mode-tab ${imageMode === "url" ? "active" : ""}`}
                      onClick={() => switchMode("url")}
                    >
                      Use URL
                    </button>
                    <button
                      type="button"
                      className={`mode-tab ${imageMode === "file" ? "active" : ""}`}
                      onClick={() => switchMode("file")}
                    >
                      Upload File
                    </button>
                  </div>

                  {imageMode === "url" ? (
                    <div className="ap-field">
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={handleUrlChange}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  ) : (
                    <div
                      className={`dropzone ${dragOver ? "drag-over" : ""} ${
                        imagePreview ? "has-preview" : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                    >
                      {imagePreview && imageMode === "file" ? (
                        <div className="preview-wrap">
                          <img src={imagePreview} alt="Preview" />
                          <button
                            type="button"
                            className="remove-preview"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="dropzone-content">
                          <span className="drop-icon">🖼️</span>
                          <p>
                            Drag & drop an image
                            <br />
                            <span>or click to browse</span>
                          </p>
                          <span className="drop-hint">PNG, JPG up to 5 MB</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="dropzone-input"
                      />
                    </div>
                  )}

                  {imagePreview && imageMode === "url" && (
                    <div className="ap-preview">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </section>

                {/* Live summary */}
                <div className="summary-card">
                  <h3>Quick Summary</h3>
                  <ul>
                    <li>
                      <span>Name</span>
                      <strong>{name || "—"}</strong>
                    </li>
                    <li>
                      <span>Category</span>
                      <strong>{category || "—"}</strong>
                    </li>
                    <li>
                      <span>Price</span>
                      <strong>{price ? `₹${price}` : "—"}</strong>
                    </li>
                    <li>
                      <span>Weight</span>
                      <strong>
                        {weight ? `${weight} ${weightUnit}` : "—"}
                      </strong>
                    </li>
                    <li>
                      <span>Stock</span>
                      <strong>{stock || "—"}</strong>
                    </li>
                    <li>
                      <span>Low Stock Alert</span>
                      <strong>
                        {lowStockAlert ? `≤ ${lowStockAlert}` : "—"}
                      </strong>
                    </li>
                    <li>
                      <span>Pcs</span>
                      <strong>{pcs || "—"}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="ap-actions">
              <button
                type="button"
                className="ap-btn ap-btn-secondary"
                onClick={() => navigate("/record")}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ap-btn ap-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="ap-spinner" />
                    Adding...
                  </>
                ) : (
                  <>➕ Add Product</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddProduct;