// src/pages/AddNamkeenProduct.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "./AuthContext";
import AdminNavbar from "../Navbar/AdminNavbar";
import BackButton from "../components/BackButton";
import "../Css/product.css";

const CATEGORIES = [
  { value: "bhujia", label: "Bhujia" },
  { value: "sev", label: "Sev" },
  { value: "mixture", label: "Mixture" },
  { value: "chips", label: "Chips / Wafers" },
  { value: "namkeen-dal", label: "Namkeen Dal" },
  { value: "mathri", label: "Mathri / Mathi" },
  { value: "chakli", label: "Chakli / Murukku" },
  { value: "peanuts", label: "Masala Peanuts" },
  { value: "other", label: "Other" },
];

const SPICE_LEVELS = [
  { value: "mild", label: "Mild", emoji: "🟢" },
  { value: "medium", label: "Medium", emoji: "🟡" },
  { value: "hot", label: "Hot", emoji: "🟠" },
  { value: "extra-hot", label: "Extra Hot", emoji: "🔴" },
];

const AddNamkeenProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    category: "bhujia",
    price: "",
    weight: "",
    stock: "",
    description: "",
    spiceLevel: "medium",
    isVeg: true,
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Guard
  if (!user?.is_admin) {
    return (
      <>
        <AdminNavbar />
        <div className="add-denied">
          <div className="add-denied-card">
            <span className="denied-icon">⛔</span>
            <h2>Access Denied</h2>
            <p>You must be an admin to add products.</p>
            <button className="btn-primary" onClick={() => navigate("/")}>
              Go Home
            </button>
          </div>
        </div>
      </>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const processImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    processImage(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processImage(e.dataTransfer.files[0]);
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Product name is required";
    if (!formData.price || Number(formData.price) <= 0)
      errs.price = "Enter a valid price";
    if (!formData.weight || Number(formData.weight) <= 0)
      errs.weight = "Enter weight in grams";
    if (formData.stock === "" || Number(formData.stock) < 0)
      errs.stock = "Enter valid stock quantity";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("name", formData.name.trim());
      payload.append("category", formData.category);
      payload.append("price", Number(formData.price));
      payload.append("weight", Number(formData.weight));
      payload.append("stock", Number(formData.stock));
      payload.append("description", formData.description.trim());
      payload.append("spiceLevel", formData.spiceLevel);
      payload.append("isVeg", formData.isVeg);
      if (image) payload.append("image", image);

      const token = localStorage.getItem("token");

      const res = await fetch("https://gokulnamkeenonlineshop-backend.onrender.com/api/admin/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to add product");
        return;
      }

      toast.success(`"${formData.name}" added successfully!`);

      // Reset
      setFormData({
        name: "",
        category: "bhujia",
        price: "",
        weight: "",
        stock: "",
        description: "",
        spiceLevel: "medium",
        isVeg: true,
      });
      setImage(null);
      setImagePreview(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      toast.error("Network error. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="add-page">
        <div className="add-container">
          {/* Header */}
          <div className="add-header">
            <BackButton
              className="back-btn"
              onClick={() => navigate(-1)}
            />
            <div className="add-header-text">
              <span className="admin-badge">Admin Panel</span>
              <h1>Add New Product</h1>
              <p>Fill in the details below to list a new namkeen item.</p>
            </div>
          </div>

          <form className="add-form" onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              {/* Left column */}
              <div className="form-main">
                {/* Basic Info */}
                <section className="form-section">
                  <h2 className="section-title">Basic Information</h2>

                  <div className="field">
                    <label htmlFor="name">
                      Product Name <span className="req">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Bikaneri Bhujia"
                      className={errors.name ? "has-error" : ""}
                    />
                    {errors.name && (
                      <span className="error-msg">{errors.name}</span>
                    )}
                  </div>

                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field">
                      <label>Vegetarian</label>
                      <label className="toggle-wrap">
                        <input
                          type="checkbox"
                          name="isVeg"
                          checked={formData.isVeg}
                          onChange={handleChange}
                        />
                        <span className="toggle-track">
                          <span className="toggle-thumb" />
                        </span>
                        <span className="toggle-label">
                          {formData.isVeg ? "Pure Veg" : "Non-Veg"}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Short description of the namkeen (ingredients, taste notes...)"
                      rows={4}
                    />
                  </div>
                </section>

                {/* Pricing & Stock */}
                <section className="form-section">
                  <h2 className="section-title">Pricing & Inventory</h2>

                  <div className="field-row three">
                    <div className="field">
                      <label htmlFor="price">
                        Price (₹) <span className="req">*</span>
                      </label>
                      <div className="input-prefix">
                        <span>₹</span>
                        <input
                          id="price"
                          type="number"
                          name="price"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="120"
                          className={errors.price ? "has-error" : ""}
                        />
                      </div>
                      {errors.price && (
                        <span className="error-msg">{errors.price}</span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="weight">
                        Weight (g) <span className="req">*</span>
                      </label>
                      <div className="input-suffix">
                        <input
                          id="weight"
                          type="number"
                          name="weight"
                          min="1"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="500"
                          className={errors.weight ? "has-error" : ""}
                        />
                        <span>g</span>
                      </div>
                      {errors.weight && (
                        <span className="error-msg">{errors.weight}</span>
                      )}
                    </div>

                    <div className="field">
                      <label htmlFor="stock">
                        Stock <span className="req">*</span>
                      </label>
                      <input
                        id="stock"
                        type="number"
                        name="stock"
                        min="0"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="50"
                        className={errors.stock ? "has-error" : ""}
                      />
                      {errors.stock && (
                        <span className="error-msg">{errors.stock}</span>
                      )}
                    </div>
                  </div>
                </section>

                {/* Spice Level */}
                <section className="form-section">
                  <h2 className="section-title">Spice Level</h2>
                  <div className="spice-grid">
                    {SPICE_LEVELS.map((s) => (
                      <label
                        key={s.value}
                        className={`spice-option ${
                          formData.spiceLevel === s.value ? "active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="spiceLevel"
                          value={s.value}
                          checked={formData.spiceLevel === s.value}
                          onChange={handleChange}
                        />
                        <span className="spice-emoji">{s.emoji}</span>
                        <span className="spice-label">{s.label}</span>
                      </label>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right column — Image */}
              <div className="form-side">
                <section className="form-section image-section">
                  <h2 className="section-title">Product Image</h2>

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
                    {imagePreview ? (
                      <div className="preview-wrap">
                        <img src={imagePreview} alt="Preview" />
                        <button
                          type="button"
                          className="remove-preview"
                          onClick={() => {
                            setImage(null);
                            setImagePreview(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-content">
                        <span className="drop-icon">🖼️</span>
                        <p>
                          Drag & drop an image here
                          <br />
                          <span>or click to browse</span>
                        </p>
                        <span className="drop-hint">PNG, JPG up to 5 MB</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="dropzone-input"
                    />
                  </div>

                  {image && (
                    <p className="file-name-display">{image.name}</p>
                  )}
                </section>

                {/* Summary card */}
                <div className="summary-card">
                  <h3>Quick Summary</h3>
                  <ul>
                    <li>
                      <span>Name</span>
                      <strong>{formData.name || "—"}</strong>
                    </li>
                    <li>
                      <span>Category</span>
                      <strong>
                        {CATEGORIES.find((c) => c.value === formData.category)
                          ?.label || "—"}
                      </strong>
                    </li>
                    <li>
                      <span>Price</span>
                      <strong>
                        {formData.price ? `₹${formData.price}` : "—"}
                      </strong>
                    </li>
                    <li>
                      <span>Weight</span>
                      <strong>
                        {formData.weight ? `${formData.weight} g` : "—"}
                      </strong>
                    </li>
                    <li>
                      <span>Stock</span>
                      <strong>{formData.stock || "—"}</strong>
                    </li>
                    <li>
                      <span>Spice</span>
                      <strong>
                        {SPICE_LEVELS.find(
                          (s) => s.value === formData.spiceLevel
                        )?.label || "—"}
                      </strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => navigate(-1)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner" />
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

export default AddNamkeenProduct;
