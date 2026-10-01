import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import UserNavbar from "../Navbar/UserNavbar";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import { getImageUrl } from "../utils/image";
import BackButton from "../components/BackButton";
import "../Css/productDetail.css";

/* ── NEW: Static fallback content ── */
const NUTRITION = [
  { label: "Energy",     value: "512 kcal" },
  { label: "Protein",    value: "12.4 g"  },
  { label: "Carbohydrates", value: "48.6 g" },
  { label: "Total Fat",  value: "29.8 g"  },
  { label: "Saturated Fat", value: "6.2 g" },
  { label: "Dietary Fiber", value: "5.1 g" },
  { label: "Sodium",     value: "780 mg"  },
  { label: "Sugar",      value: "2.3 g"   },
];

const INGREDIENTS = [
  "Bengal Gram Flour (Besan)",
  "Rice Flour",
  "Refined Sunflower Oil",
  "Iodized Salt",
  "Red Chilli Powder",
  "Turmeric",
  "Cumin Seeds",
  "Asafoetida (Hing)",
  "Curry Leaves",
  "Dry Mango Powder (Amchur)",
];

const STORAGE_TIPS = [
  { icon: "🌡️", title: "Cool & Dry",     desc: "Store in a cool, dry place away from direct sunlight." },
  { icon: "🔒", title: "Airtight Container", desc: "Transfer to an airtight jar after opening to keep it crispy." },
  { icon: "🥄", title: "Use Dry Spoon",  desc: "Always use a clean, dry spoon to avoid moisture." },
  { icon: "⏳", title: "Best Within",    desc: "Consume within 30 days of opening for best taste." },
];

const REVIEWS = [
  {
    name: "Ramesh Patel",
    rating: 5,
    date: "2 weeks ago",
    title: "Authentic taste, just like home",
    text: "Ordered 1kg pack and the freshness is amazing. Tastes exactly like the namkeen my grandmother used to make. Will definitely reorder!",
  },
  {
    name: "Priya Sharma",
    rating: 5,
    date: "1 month ago",
    title: "Perfect for festivals",
    text: "Bought a big pack for Diwali and everyone loved it. Packaging was neat and delivery was quick.",
  },
  {
    name: "Amit Desai",
    rating: 4,
    date: "1 month ago",
    title: "Great quality, slightly spicy",
    text: "Very good quality and crunch. Just a little spicier than expected, but still delicious with tea.",
  },
];

const FAQ_ITEMS = [
  { q: "Is this product vegetarian?", a: "Yes, 100% vegetarian. No animal-derived ingredients are used." },
  { q: "Does it contain preservatives?", a: "We use only natural preservatives and no artificial additives." },
  { q: "How long does it stay fresh?", a: "Best consumed within 3 months of the manufacturing date when stored properly." },
  { q: "Is it suitable for kids?", a: "Yes, but we recommend it in moderation due to spice levels." },
];

/* ── NEW: Helpers ── */
const renderStars = (rating) => "★".repeat(rating) + "☆".repeat(5 - rating);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState("description");

  // ── NEW: related products + FAQ state ──
  const [related, setRelated] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);
  const [copied, setCopied] = useState(false);

  /* ─── Fetch single product ─── */
  useEffect(() => {
    const fetchOne = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);

        /* ── NEW: fetch related products by category ── */
        try {
          const relRes = await api.get("/products");
          const list = Array.isArray(relRes.data) ? relRes.data : [];
          const filtered = list
            .filter((p) => p.id !== data.id)
            .filter((p) =>
              data.category ? p.category === data.category : true
            )
            .slice(0, 4);
          setRelated(filtered);
        } catch {
          setRelated([]);
        }
      } catch {
        toast.error("Product not found");
        navigate("/products");
      } finally {
        setLoading(false);
      }
    };
    fetchOne();
  }, [id, navigate]);

  /* ─── Build variants array (with legacy fallback) ─── */
  const variants =
    product && Array.isArray(product.variants) && product.variants.length > 0
      ? product.variants
      : product && product.weight != null && product.price != null
      ? [
          {
            weight: product.weight,
            weightUnit: product.weightUnit || "g",
            price: product.price,
            stock: product.stock ?? 0,
            pcs: product.pcs ?? 0,
          },
        ]
      : [];

  const current = variants[selectedIdx] || null;
  const displayPrice = current?.price ?? product?.price ?? 0;
  const displayWeight = current?.weight ?? product?.weight;
  const displayUnit = current?.weightUnit ?? product?.weightUnit ?? "g";
  const displayPcs = current?.pcs ?? product?.pcs ?? 0;
  const outOfStock = product?.stock === 0;

  /* ─── Add to cart ─── */
  const addToCart = () => {
    if (!product) return;
    if (outOfStock) {
      toast.error("Out of stock");
      return;
    }
    if (!current) {
      toast.error("Please choose a size");
      return;
    }

    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      cart = [];
    }

    const cartKey = `${product.id}-${current.weight ?? ""}-${
      current.weightUnit ?? ""
    }-${current.pcs ?? 0}`;

    const existing = cart.find((item) => item.cartKey === cartKey);

    if (existing) {
      existing.quantity = (existing.quantity || 1) + qty;
    } else {
      cart.push({
        cartKey,
        id: product.id,
        name: product.name,
        image: product.image,
        stock: product.stock,
        price: current.price,
        weight: current.weight,
        weightUnit: current.weightUnit || "g",
        pcs: current.pcs ?? product.pcs ?? 0,
        quantity: qty,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    const label = `${current.weight ?? ""}${current.weightUnit || ""}${
      current.pcs ? ` · ${current.pcs} pcs` : ""
    }`;

    toast.success(`${qty} × ${product.name} (${label}) added!`, {
      icon: "🛒",
    });

    window.dispatchEvent(new Event("cart-updated"));
  };

  const buyNow = () => {
    addToCart();
    navigate("/payment");
  };

  const totalPrice = displayPrice * qty;

  /* ── NEW: Share handler ── */
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || "Gokul Namkeen Product",
          text: `Check out ${product?.name} on Gokul Namkeen`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled — silent */
    }
  };

  return (
    <>
      {user?.is_admin ? <AdminNavbar /> : <UserNavbar />}
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="pd-page">
        <div className="pd-container">
          {/* Breadcrumb / Back */}
          <div className="pd-breadcrumb">
            <BackButton
              className="pd-back"
              onClick={() => navigate(-1)}
            />
            {product?.category && (
              <span className="pd-breadcrumb-cat">
                / <span>{product.category}</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="pd-loading">
              <div className="pd-spinner" />
              <p>Loading product details...</p>
            </div>
          ) : !product ? (
            <div className="pd-empty">
              <div className="pd-empty-icon">📦</div>
              <h3>Product not found</h3>
              <p>This item may have been removed or is no longer available.</p>
              <button className="pd-btn pd-btn-primary" onClick={() => navigate("/products")}>
                Browse Products
              </button>
            </div>
          ) : (
            <>
              <div className="pd-grid">
                {/* ─── LEFT: Gallery ─── */}
                <div className="pd-gallery">
                  <div className="pd-main-image">
                    {product.image ? (
                      <img
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        loading="eager"
                      />
                    ) : (
                      <div className="pd-fallback">
                        <span>🌾</span>
                        <p>No image available</p>
                      </div>
                    )}

                    {outOfStock && (
                      <span className="pd-badge pd-badge-out">Out of Stock</span>
                    )}

                    {!outOfStock && displayPcs > 0 && (
                      <span className="pd-badge pd-badge-pcs">
                        📦 Pack of {displayPcs}
                      </span>
                    )}

                    {!outOfStock && product.stock < 10 && product.stock > 0 && (
                      <span className="pd-badge pd-badge-low">
                        Only {product.stock} left
                      </span>
                    )}
                  </div>

                  {/* Trust badges under image */}
                  <div className="pd-trust-row">
                    <div className="pd-trust-item">
                      <span>🔒</span>
                      <span>Secure Checkout</span>
                    </div>
                    <div className="pd-trust-item">
                      <span>🚚</span>
                      <span>Fast Delivery</span>
                    </div>
                    <div className="pd-trust-item">
                      <span>↩️</span>
                      <span>Easy Returns</span>
                    </div>
                  </div>

                  {/* ── NEW: Share row ── */}
                  <div className="pd-share-row">
                    <span className="pd-share-label">Share this product:</span>
                    <button
                      type="button"
                      className="pd-share-btn"
                      onClick={handleShare}
                      aria-label="Share product"
                    >
                      {copied ? "✓ Link Copied" : "🔗 Share"}
                    </button>
                  </div>
                </div>

                {/* ─── RIGHT: Info ─── */}
                <div className="pd-info">
                  <div className="pd-header">
                    {product.category && (
                      <span className="pd-category">{product.category}</span>
                    )}
                    <h1 className="pd-title">{product.name}</h1>
                  </div>

                  {/* Price block */}
                  <div className="pd-price-block">
                    <div className="pd-price-main">
                      <span className="pd-currency">₹</span>
                      <span className="pd-price">{displayPrice}</span>
                    </div>
                    <div className="pd-price-meta">
                      <span className="pd-price-note">Inclusive of all taxes</span>
                      {displayWeight && (
                        <span className="pd-unit-price">
                          ({displayWeight}
                          {displayUnit}
                          {displayPcs > 0 ? ` · ${displayPcs} pcs` : ""})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock status */}
                  <div className="pd-stock-row">
                    {outOfStock ? (
                      <span className="pd-stock pd-stock-out">
                        <span className="pd-stock-dot" /> Out of Stock
                      </span>
                    ) : product.stock < 10 ? (
                      <span className="pd-stock pd-stock-low">
                        <span className="pd-stock-dot" /> Only {product.stock} left
                        in stock
                      </span>
                    ) : (
                      <span className="pd-stock pd-stock-in">
                        <span className="pd-stock-dot" /> In Stock — Ready to ship
                      </span>
                    )}
                  </div>

                  {/* Variant picker */}
                  {variants.length > 0 && (
                    <div className="pd-variant-section">
                      <div className="pd-section-header">
                        <h3 className="pd-section-title">Select Size / Pack</h3>
                        <span className="pd-selected-label">
                          Selected:{" "}
                          <strong>
                            {displayWeight}
                            {displayUnit}
                            {displayPcs > 0 && ` · ${displayPcs} pcs`}
                          </strong>
                        </span>
                      </div>

                      <div className="pd-variant-grid">
                        {variants.map((v, idx) => {
                          const isActive = idx === selectedIdx;
                          const vPcs = v.pcs ?? product.pcs ?? 0;

                          return (
                            <button
                              key={idx}
                              className={`pd-variant-box ${isActive ? "active" : ""}`}
                              onClick={() => {
                                setSelectedIdx(idx);
                                setQty(1);
                              }}
                              type="button"
                            >
                              <span className="pd-variant-weight">
                                {v.weight}
                                {v.weightUnit || "g"}
                              </span>
                              {vPcs > 0 && (
                                <span className="pd-variant-pcs">
                                  📦 {vPcs} pcs
                                </span>
                              )}
                              <span className="pd-variant-price">₹{v.price}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  {!outOfStock && (
                    <div className="pd-qty-section">
                      <h3 className="pd-section-title">Quantity</h3>
                      <div className="pd-qty-row">
                        <div className="pd-qty-controls">
                          <button
                            type="button"
                            className="pd-qty-btn"
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            disabled={qty <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="pd-qty-value">{qty}</span>
                          <button
                            type="button"
                            className="pd-qty-btn"
                            onClick={() =>
                              setQty((q) => Math.min(product.stock, q + 1))
                            }
                            disabled={qty >= product.stock}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                        <div className="pd-qty-total">
                          <span>Total</span>
                          <strong>₹{totalPrice.toLocaleString("en-IN")}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Primary Actions */}
                  <div className="pd-actions">
                    <button
                      className="pd-btn pd-btn-primary"
                      onClick={addToCart}
                      disabled={outOfStock}
                      type="button"
                    >
                      <span className="pd-btn-icon">🛒</span>
                      Add to Cart
                    </button>
                    <button
                      className="pd-btn pd-btn-secondary"
                      onClick={buyNow}
                      disabled={outOfStock}
                      type="button"
                    >
                      <span className="pd-btn-icon">⚡</span>
                      Buy Now
                    </button>
                  </div>

                  {/* Quick highlights */}
                  <div className="pd-highlights">
                    <div className="pd-highlight">
                      <span className="pd-highlight-icon">✅</span>
                      <div>
                        <strong>Quality Assured</strong>
                        <p>Fresh & carefully selected</p>
                      </div>
                    </div>
                    <div className="pd-highlight">
                      <span className="pd-highlight-icon">📦</span>
                      <div>
                        <strong>Secure Packaging</strong>
                        <p>Protects freshness during transit</p>
                      </div>
                    </div>
                    <div className="pd-highlight">
                      <span className="pd-highlight-icon">💳</span>
                      <div>
                        <strong>Safe Payment</strong>
                        <p>Multiple payment options available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Tabs ─── */}
              <div className="pd-tabs-section">
                <div className="pd-tabs">
                  <button
                    className={`pd-tab ${activeTab === "description" ? "active" : ""}`}
                    onClick={() => setActiveTab("description")}
                    type="button"
                  >
                    Description
                  </button>
                  <button
                    className={`pd-tab ${activeTab === "details" ? "active" : ""}`}
                    onClick={() => setActiveTab("details")}
                    type="button"
                  >
                    Product Details
                  </button>
                  <button
                    className={`pd-tab ${activeTab === "nutrition" ? "active" : ""}`}
                    onClick={() => setActiveTab("nutrition")}
                    type="button"
                  >
                    Nutrition
                  </button>
                  <button
                    className={`pd-tab ${activeTab === "shipping" ? "active" : ""}`}
                    onClick={() => setActiveTab("shipping")}
                    type="button"
                  >
                    Shipping & Returns
                  </button>
                </div>

                <div className="pd-tab-content">
                  {activeTab === "description" && (
                    <div className="pd-tab-pane">
                      {product.description ? (
                        <p className="pd-desc">{product.description}</p>
                      ) : (
                        <p className="pd-muted">
                          No detailed description available for this product yet.
                        </p>
                      )}
                    </div>
                  )}

                  {activeTab === "details" && (
                    <div className="pd-tab-pane">
                      <ul className="pd-spec-list">
                        <li>
                          <span>Product Name</span>
                          <strong>{product.name}</strong>
                        </li>
                        {product.category && (
                          <li>
                            <span>Category</span>
                            <strong>{product.category}</strong>
                          </li>
                        )}
                        {displayWeight && (
                          <li>
                            <span>Net Weight / Pack</span>
                            <strong>
                              {displayWeight}
                              {displayUnit}
                              {displayPcs > 0 && ` · ${displayPcs} pieces`}
                            </strong>
                          </li>
                        )}
                        <li>
                          <span>Availability</span>
                          <strong>
                            {outOfStock
                              ? "Out of Stock"
                              : product.stock < 10
                              ? `Limited (${product.stock} left)`
                              : "In Stock"}
                          </strong>
                        </li>
                        <li>
                          <span>Price</span>
                          <strong>₹{displayPrice}</strong>
                        </li>
                        <li>
                          <span>Shelf Life</span>
                          <strong>3 months from packaging</strong>
                        </li>
                        <li>
                          <span>Country of Origin</span>
                          <strong>India 🇮🇳</strong>
                        </li>
                        <li>
                          <span>Dietary</span>
                          <strong>100% Vegetarian</strong>
                        </li>
                      </ul>
                    </div>
                  )}

                  {/* ── NEW: Nutrition tab ── */}
                  {activeTab === "nutrition" && (
                    <div className="pd-tab-pane">
                      <p className="pd-tab-intro">
                        Approximate nutritional values per 100 g serving.
                      </p>
                      <div className="pd-nutrition-grid">
                        {NUTRITION.map((n) => (
                          <div key={n.label} className="pd-nutrition-item">
                            <span className="pd-nutrition-label">{n.label}</span>
                            <span className="pd-nutrition-value">{n.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "shipping" && (
                    <div className="pd-tab-pane">
                      <div className="pd-shipping-grid">
                        <div className="pd-shipping-card">
                          <h4>🚚 Delivery</h4>
                          <p>
                            Orders are usually processed within 24 hours. Delivery
                            times vary by location (typically 2–5 business days).
                          </p>
                        </div>
                        <div className="pd-shipping-card">
                          <h4>↩️ Returns</h4>
                          <p>
                            Not satisfied? Contact us within 7 days of delivery for
                            eligible returns or replacements (subject to product
                            condition).
                          </p>
                        </div>
                        <div className="pd-shipping-card">
                          <h4>💬 Support</h4>
                          <p>
                            Need help with your order? Reach out to our support team
                            — we're happy to assist.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── NEW: Ingredients & Storage ── */}
              <section className="pd-ingredients-section">
                <div className="pd-info-grid">
                  <div className="pd-info-block">
                    <h3 className="pd-block-title">
                      <span>🥘</span> Ingredients
                    </h3>
                    <ul className="pd-ingredients-list">
                      {INGREDIENTS.map((ing) => (
                        <li key={ing}>
                          <span className="pd-ing-dot" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                    <p className="pd-block-note">
                      Contains allergens: may contain traces of peanuts and tree
                      nuts.
                    </p>
                  </div>

                  <div className="pd-info-block">
                    <h3 className="pd-block-title">
                      <span>📦</span> Storage Instructions
                    </h3>
                    <div className="pd-storage-grid">
                      {STORAGE_TIPS.map((s) => (
                        <div key={s.title} className="pd-storage-item">
                          <span className="pd-storage-icon">{s.icon}</span>
                          <div>
                            <strong>{s.title}</strong>
                            <p>{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* ── NEW: Reviews ── */}
              <section className="pd-reviews-section">
                <header className="pd-reviews-head">
                  <div>
                    <h2 className="pd-section-title-large">
                      Customer Reviews
                    </h2>
                    <p className="pd-reviews-sub">
                      What people are saying about this product
                    </p>
                  </div>
                  <div className="pd-reviews-summary">
                    <div className="pd-reviews-score">
                      <span className="pd-score-value">4.7</span>
                      <span className="pd-score-stars">{renderStars(5)}</span>
                    </div>
                    <span className="pd-reviews-count">
                      Based on 128 reviews
                    </span>
                  </div>
                </header>

                <div className="pd-reviews-grid">
                  {REVIEWS.map((r, i) => (
                    <article key={i} className="pd-review-card">
                      <div className="pd-review-top">
                        <div className="pd-review-avatar">
                          {r.name.charAt(0)}
                        </div>
                        <div className="pd-review-meta">
                          <strong>{r.name}</strong>
                          <span>{r.date}</span>
                        </div>
                      </div>
                      <div className="pd-review-stars">
                        {renderStars(r.rating)}
                      </div>
                      <h4 className="pd-review-title">{r.title}</h4>
                      <p className="pd-review-text">{r.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              {/* ── NEW: FAQ ── */}
              <section className="pd-faq-section">
                <h2 className="pd-section-title-large">
                  Frequently Asked Questions
                </h2>
                <div className="pd-faq-list">
                  {FAQ_ITEMS.map((f, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div
                        key={f.q}
                        className={`pd-faq-item ${isOpen ? "is-open" : ""}`}
                      >
                        <button
                          type="button"
                          className="pd-faq-question"
                          onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                          aria-expanded={isOpen}
                        >
                          <span>{f.q}</span>
                          <span className="pd-faq-toggle">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="pd-faq-answer">
                            <p>{f.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ── NEW: Related products ── */}
              {related.length > 0 && (
                <section className="pd-related-section">
                  <h2 className="pd-section-title-large">
                    You May Also Like
                  </h2>
                  <div className="pd-related-grid">
                    {related.map((r) => (
                      <article
                        key={r.id}
                        className="pd-related-card"
                        onClick={() => {
                          navigate(`/product/${r.id}`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            navigate(`/product/${r.id}`);
                          }
                        }}
                      >
                        <div className="pd-related-image">
                          {r.image ? (
                            <img src={getImageUrl(r.image)} alt={r.name} loading="lazy" />
                          ) : (
                            <div className="pd-related-fallback">🌾</div>
                          )}
                        </div>
                        <h4>{r.name}</h4>
                        {r.category && (
                          <span className="pd-related-cat">{r.category}</span>
                        )}
                        <div className="pd-related-price">
                          ₹{r.price ?? 0}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDetail;