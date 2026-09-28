// src/pages/ProductPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import UserNavbar from "../Navbar/UserNavbar";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import { getImageUrl } from "../utils/image";
import "../Css/product.css";

const ProductPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cartCount, setCartCount] = useState(0);
  const [bumpCart, setBumpCart] = useState(false);
  const [flyer, setFlyer] = useState(null);

  /* Fetch products */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get("/products");
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /* Cart badge count */
  useEffect(() => {
    const updateCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(
          cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
        );
      } catch {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener("cart-updated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("cart-updated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  const categories = [
    "all",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const filtered = products.filter((p) => {
    const matchSearch = p.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchCat =
      categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const getInCartQty = (productId) => {
    try {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      return cart
        .filter((it) => it.id === productId)
        .reduce((s, it) => s + (it.quantity || 1), 0);
    } catch {
      return 0;
    }
  };

  const addToCart = (product, e) => {
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      cart = [];
    }

    const currentInCart = cart
      .filter((it) => it.id === product.id)
      .reduce((s, it) => s + (it.quantity || 1), 0);

    if (currentInCart >= product.stock) {
      toast.error(`Only ${product.stock} in stock`);
      return;
    }

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const picked =
      variants.length > 0
        ? variants[0]
        : {
            weight: product.weight,
            weightUnit: product.weightUnit || "g",
            price: product.price,
            pcs: product.pcs ?? 0,
          };

    const cartKey = `${product.id}-${picked.weight ?? ""}-${
      picked.weightUnit ?? ""
    }-${picked.pcs ?? 0}`;

    /* Fly animation */
    if (e?.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      setFlyer({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        img: product.image ? getImageUrl(product.image) : "",
      });
      setTimeout(() => setFlyer(null), 800);
    }

    const existing = cart.find((item) => item.cartKey === cartKey);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        cartKey,
        id: product.id,
        name: product.name,
        image: product.image,
        stock: product.stock,
        price: picked.price,
        weight: picked.weight,
        weightUnit: picked.weightUnit || "g",
        pcs: picked.pcs ?? 0,
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cart-updated"));

    setBumpCart(true);
    setTimeout(() => setBumpCart(false), 400);

    toast.success(`${product.name} added to cart!`, {
      icon: "🛒",
      duration: 2000,
    });
  };

  const getPriceDisplay = (p) => {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const prices = variants
      .map((v) => Number(v.price))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (prices.length > 0) {
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `₹${min}` : `₹${min} – ₹${max}`;
    }
    return p.price != null ? `₹${p.price}` : "Price N/A";
  };

  return (
    <>
      {user?.is_admin ? <AdminNavbar /> : <UserNavbar />}
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />

      <div className="product-page">
        {/* Floating cart → /cart */}
        <button
          className={`floating-cart-btn ${bumpCart ? "bump" : ""}`}
          onClick={() => navigate("/cart")}
          aria-label="Open cart"
          type="button"
        >
          🛒
          {cartCount > 0 && (
            <span className="floating-cart-badge">{cartCount}</span>
          )}
        </button>

        <div className="product-container">
          {/* Header */}
          <header className="product-header">
            <div className="product-header-left">
              <div className="product-header-icon">🛍️</div>
              <div>
                <h1>Our Products</h1>
                <p>Authentic snacks & sweets, handpicked for you</p>
              </div>
            </div>

            <div className="product-search">
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

          {/* Category chips */}
          {!loading && categories.length > 1 && (
            <div className="product-filters">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`filter-chip ${
                    categoryFilter === c ? "active" : ""
                  }`}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c === "all" ? "All" : c}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div className="product-loading">
              <div className="product-spinner" />
              <p>Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="product-empty">
              <div className="empty-icon">📦</div>
              <h3>
                {search || categoryFilter !== "all"
                  ? "No matching products"
                  : "No products yet"}
              </h3>
              <p>
                {search
                  ? "Try a different search term."
                  : "Check back soon for our latest offerings."}
              </p>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((p) => {
                const totalInCart = getInCartQty(p.id);
                const inCart = totalInCart > 0;
                const outOfStock = p.stock === 0;

                return (
                  <article
                    key={p.id}
                    className={`product-card ${
                      outOfStock ? "out-of-stock" : ""
                    }`}
                  >
                    <div
                      className="product-clickable"
                      onClick={() => navigate(`/product/${p.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/product/${p.id}`);
                        }
                      }}
                    >
                      <div className="product-image">
                        {p.image ? (
                          <img
                            src={getImageUrl(p.image)}
                            alt={p.name}
                            loading="lazy"
                          />
                        ) : (
                          <span className="product-fallback">🌾</span>
                        )}

                        {outOfStock && (
                          <span className="product-badge out">
                            Out of Stock
                          </span>
                        )}
                        {inCart && !outOfStock && (
                          <span className="product-badge in-cart">
                            ✓ In Cart ({totalInCart})
                          </span>
                        )}
                        {!outOfStock && p.stock > 0 && p.stock < 10 && (
                          <span className="product-badge low">
                            Only {p.stock} left
                          </span>
                        )}
                      </div>

                      <div className="product-body">
                        {p.category && (
                          <span className="product-category">
                            {p.category}
                          </span>
                        )}
                        <h3 className="product-title">{p.name}</h3>
                        {p.description && (
                          <p className="product-desc">{p.description}</p>
                        )}
                        <div className="product-meta">
                          <span className="product-price">
                            {getPriceDisplay(p)}
                          </span>
                          <div className="product-tags">
                            {p.weight != null && p.weight !== "" && (
                              <span className="tag weight">
                                {p.weight}
                                {p.weightUnit || "g"}
                              </span>
                            )}
                            {Number(p.pcs) > 0 && (
                              <span className="tag pcs">
                                📦 {p.pcs} pcs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="product-card-actions">
                      <button
                        type="button"
                        className="add-cart-btn"
                        disabled={outOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p, e);
                        }}
                      >
                        {outOfStock ? "Out of Stock" : "🛒 Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fly animation */}
      {flyer && (
        <div
          className="fly-to-cart"
          style={{ left: flyer.x, top: flyer.y }}
        >
          {flyer.img ? (
            <img src={flyer.img} alt="" />
          ) : (
            <span className="fly-fallback">🌾</span>
          )}
        </div>
      )}
    </>
  );
};

export default ProductPage;