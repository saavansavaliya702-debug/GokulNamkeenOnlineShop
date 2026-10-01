// src/pages/Cart.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import toast, { Toaster } from "react-hot-toast";
import UserNavbar from "../Navbar/UserNavbar";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import { getImageUrl } from "../utils/image";
import api from "../utils/api";
import "../Css/Cart.css";

/* ── Coupons ── */
const COUPONS = {
  WELCOME10: { type: "percent", value: 10, minOrder: 300, label: "10% off" },
  SAVE50:    { type: "flat",    value: 50, minOrder: 500, label: "₹50 off"  },
  FESTIVE20: { type: "percent", value: 20, minOrder: 1000, label: "20% off" },
};

/* ── Delivery estimate ── */
const getDeliveryRange = () => {
  const from = new Date();
  from.setDate(from.getDate() + 3);
  const to = new Date();
  to.setDate(to.getDate() + 6);
  const fmt = (d) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${fmt(from)} – ${fmt(to)}`;
};

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("cart") || "[]");
      return raw.map((it) => ({
        ...it,
        cartKey:
          it.cartKey ??
          `${it.id}-${it.weight ?? ""}-${it.weightUnit ?? ""}-${it.pcs ?? 0}`,
        pcs: it.pcs ?? 0,
      }));
    } catch {
      return [];
    }
  });

  /* ── NEW: coupon + related state ── */
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [savedItems, setSavedItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cart-saved") || "[]");
    } catch {
      return [];
    }
  });
  const [savingCartKey, setSavingCartKey] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const sync = () => {
      try {
        const raw = JSON.parse(localStorage.getItem("cart") || "[]");
        setCart(
          raw.map((it) => ({
            ...it,
            cartKey:
              it.cartKey ??
              `${it.id}-${it.weight ?? ""}-${it.weightUnit ?? ""}-${
                it.pcs ?? 0
              }`,
            pcs: it.pcs ?? 0,
          }))
        );
      } catch {
        setCart([]);
      }
    };

    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /* ── NEW: fetch related products ── */
  useEffect(() => {
    if (cart.length === 0) {
      setRelated([]);
      return;
    }
    const categories = [...new Set(cart.map((c) => c.category).filter(Boolean))];
    if (categories.length === 0) return;

    let mounted = true;
    api
      .get("/products")
      .then(({ data }) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        const cartIds = new Set(cart.map((c) => c.id));
        const filtered = list
          .filter((p) => !cartIds.has(p.id))
          .filter((p) => categories.includes(p.category))
          .slice(0, 4);
        setRelated(filtered);
      })
      .catch(() => setRelated([]));
    return () => {
      mounted = false;
    };
  }, [cart]);

  const persist = (next) => {
    localStorage.setItem("cart", JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
    return next;
  };

  const persistSaved = (next) => {
    localStorage.setItem("cart-saved", JSON.stringify(next));
    setSavedItems(next);
    return next;
  };

  const updateQuantity = (cartKey, delta) => {
    setCart((prev) => {
      const next = prev
        .map((item) =>
          item.cartKey === cartKey
            ? {
                ...item,
                quantity: Math.max(1, (item.quantity || 1) + delta),
              }
            : item
        )
        .filter((item) => item.quantity > 0);
      return persist(next);
    });
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.cartKey !== cartKey);
      return persist(next);
    });
    toast.success("Removed from cart");
  };

  const clearCart = () => {
    if (!window.confirm("Clear entire cart?")) return;
    setCart(persist([]));
    setAppliedCoupon(null);
    toast.success("Cart cleared");
  };

  /* ── NEW: save for later ── */
  const saveForLater = (item) => {
    const exists = savedItems.find((s) => s.cartKey === item.cartKey);
    if (!exists) persistSaved([...savedItems, item]);
    setCart((prev) => persist(prev.filter((i) => i.cartKey !== item.cartKey)));
    toast.success("Saved for later");
  };

  const startSaveForLater = (item) => {
    if (savingCartKey !== null) return;
    setSavingCartKey(item.cartKey);
  };

  const finishSaveForLater = (event, item) => {
    if (
      event.target !== event.currentTarget ||
      event.animationName !== "cart-row-save"
    ) {
      return;
    }
    saveForLater(item);
    setSavingCartKey(null);
  };

  const moveToCart = (item) => {
    const cartKey =
      item.cartKey ??
      `${item.id}-${item.weight ?? ""}-${item.weightUnit ?? ""}-${item.pcs ?? 0}`;
    const exists = cart.find((c) => c.cartKey === cartKey);
    let nextCart;
    if (exists) {
      nextCart = cart.map((c) =>
        c.cartKey === cartKey
          ? { ...c, quantity: (c.quantity || 1) + (item.quantity || 1) }
          : c
      );
    } else {
      nextCart = [...cart, { ...item, cartKey, quantity: item.quantity || 1 }];
    }
    setCart(persist(nextCart));
    persistSaved(savedItems.filter((s) => s.cartKey !== item.cartKey));
    toast.success("Moved to cart");
  };

  const removeSaved = (cartKey) => {
    persistSaved(savedItems.filter((s) => s.cartKey !== cartKey));
  };

  /* ── Totals (with coupon) ── */
  const cartCount = cart.reduce((s, it) => s + (it.quantity || 1), 0);
  const subtotal = cart.reduce(
    (s, it) => s + it.price * (it.quantity || 1),
    0
  );

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const c = COUPONS[appliedCoupon];
    if (!c) return 0;
    if (subtotal < c.minOrder) return 0;
    return c.type === "percent"
      ? Math.round((subtotal * c.value) / 100)
      : c.value;
  }, [appliedCoupon, subtotal]);

  const shipping = subtotal > 500 ? 0 : subtotal > 0 ? 40 : 0;
  const tax = Math.round((subtotal - discount) * 0.05);
  const total = Math.max(0, subtotal - discount + shipping + tax);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return toast.error("Enter a coupon code");
    const c = COUPONS[code];
    if (!c) return toast.error("Invalid coupon code");
    if (subtotal < c.minOrder) {
      return toast.error(
        `Minimum order ₹${c.minOrder} required for ${code}`
      );
    }
    setAppliedCoupon(code);
    toast.success(`${code} applied — ${c.label}!`);
    setCouponInput("");
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast.success("Coupon removed");
  };

  const deliveryRange = getDeliveryRange();

  return (
    <>
      {user?.is_admin ? <AdminNavbar /> : <UserNavbar />}
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />

      <div className="cart-page">
        <div className="cart-container">
          <header className="cart-header">
            <div className="cart-heading">
              <BackButton
                className="cart-back"
                onClick={() => navigate(-1)}
              />
              <div>
                <h1>Your Cart</h1>
                <p>
                  {cartCount === 0
                    ? "No items yet"
                    : `${cartCount} item${cartCount !== 1 ? "s" : ""} in cart`}
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <button
                className="clear-cart-btn"
                onClick={clearCart}
                type="button"
              >
                Clear cart
              </button>
            )}
          </header>

          {/* ── NEW: Free shipping banner ── */}
          {cart.length > 0 && (
            <div className="cart-banner">
              {subtotal >= 500 ? (
                <span className="cart-banner-success">
                  🎉 You've unlocked <strong>FREE shipping!</strong>
                </span>
              ) : (
                <span>
                  🚚 Add <strong>₹{Math.ceil(500 - subtotal)}</strong> more to
                  unlock FREE shipping
                </span>
              )}
            </div>
          )}

          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <div className="empty-icon">🛒</div>
              <h2>Your cart is empty</h2>
              <p>Add some products to get started</p>
              <button
                className="btn-primary"
                onClick={() => navigate("/product")}
                type="button"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div
                    key={item.cartKey}
                    className={`cart-row ${savingCartKey === item.cartKey ? "is-saving" : ""}`}
                    onAnimationEnd={(event) => finishSaveForLater(event, item)}
                  >
                    <div className="cart-row-thumb">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                        />
                      ) : (
                        <span>🌾</span>
                      )}
                    </div>

                    <div className="cart-row-info">
                      <h3>{item.name}</h3>
                      <p className="cart-row-meta">
                        ₹{item.price}
                        {item.weight != null && item.weight !== "" && (
                          <span>
                            {" "}
                            · {item.weight}
                            {item.weightUnit || "g"}
                          </span>
                        )}
                        {Number(item.pcs) > 0 && (
                          <span> · 📦 {item.pcs} pcs</span>
                        )}
                      </p>

                      {/* ── NEW: delivery estimate per item ── */}
                      <p className="cart-row-delivery">
                        🚚 Delivery by <strong>{deliveryRange}</strong>
                      </p>

                      <div className="cart-row-actions">
                        <div className="qty-controls">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey, -1)}
                          >
                            −
                          </button>
                          <span>{item.quantity || 1}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey, +1)}
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="remove-btn"
                          type="button"
                          onClick={() => removeFromCart(item.cartKey)}
                        >
                          🗑️ Remove
                        </button>
                        {/* ── NEW: save for later ── */}
                        <button
                          className="save-btn"
                          type="button"
                          onClick={() => startSaveForLater(item)}
                          disabled={savingCartKey !== null}
                        >
                          {savingCartKey === item.cartKey ? "Saving..." : "🔖 Save for later"}
                        </button>
                      </div>
                    </div>

                    <div className="cart-row-total">
                      ₹
                      {(
                        item.price * (item.quantity || 1)
                      ).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>

              <aside className="cart-summary">
                <h2>Order Summary</h2>

                {/* ── NEW: Coupon block ── */}
                <div className="coupon-block">
                  {appliedCoupon ? (
                    <div className="coupon-applied">
                      <div>
                        <strong>{appliedCoupon}</strong>
                        <span>{COUPONS[appliedCoupon].label} applied</span>
                      </div>
                      <button
                        type="button"
                        className="coupon-remove"
                        onClick={removeCoupon}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="coupon-input-row">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && applyCoupon()
                        }
                      />
                      <button
                        type="button"
                        className="coupon-apply"
                        onClick={applyCoupon}
                      >
                        Apply
                      </button>
                    </div>
                  )}
                  {!appliedCoupon && (
                    <div className="coupon-hints">
                      <span>Try: WELCOME10</span>
                      <span>SAVE50</span>
                      <span>FESTIVE20</span>
                    </div>
                  )}
                </div>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discount > 0 && (
                    <div className="summary-row discount">
                      <span>Coupon ({appliedCoupon})</span>
                      <span>− ₹{discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="free">FREE</span>
                      ) : (
                        `₹${shipping}`
                      )}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tax (5%)</span>
                    <span>₹{tax}</span>
                  </div>
                  <div className="summary-row grand">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {subtotal > 0 && subtotal <= 500 && (
                  <p className="ship-hint">
                    Add ₹{Math.ceil(500 - subtotal)} more for free shipping
                  </p>
                )}

                <button
                  className="checkout-btn"
                  type="button"
                  onClick={() => navigate("/payment")}
                >
                  Proceed to Checkout →
                </button>

                <button
                  className="continue-btn"
                  type="button"
                  onClick={() => navigate("/product")}
                >
                  Continue Shopping
                </button>

                {/* ── NEW: Trust badges ── */}
                <div className="cart-trust">
                  <div className="cart-trust-item">
                    <span>🔒</span>
                    <span>Secure Checkout</span>
                  </div>
                  <div className="cart-trust-item">
                    <span>🚚</span>
                    <span>Fast Delivery</span>
                  </div>
                  <div className="cart-trust-item">
                    <span>↩️</span>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </aside>
            </div>
          )}

          {/* ── NEW: Saved for later ── */}
          {savedItems.length > 0 && (
            <section className="cart-saved-section">
              <div className="cart-saved-heading">
                <div>
                  <span className="cart-saved-eyebrow">Your shortlist</span>
                  <h2>Saved for Later</h2>
                </div>
                <span className="cart-saved-count" aria-label={`${savedItems.length} saved items`}>
                  {savedItems.length}
                </span>
              </div>
              <div className="cart-saved-grid">
                {savedItems.map((item) => (
                  <article key={item.cartKey} className="saved-card">
                    <div className="saved-thumb">
                      {item.image ? (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                        />
                      ) : (
                        <span>🌾</span>
                      )}
                    </div>
                    <h4>{item.name}</h4>
                    <p className="saved-price">₹{item.price}</p>
                    <div className="saved-actions">
                      <button
                        type="button"
                        className="saved-move"
                        onClick={() => moveToCart(item)}
                      >
                        Move to Cart
                      </button>
                      <button
                        type="button"
                        className="saved-remove"
                        onClick={() => removeSaved(item.cartKey)}
                        aria-label={`Remove ${item.name} from saved items`}
                      >
                        ✕
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* ── NEW: You may also like ── */}
          {related.length > 0 && (
            <section className="cart-related-section">
              <h2>You May Also Like</h2>
              <div className="cart-related-grid">
                {related.map((r) => (
                  <article
                    key={r.id}
                    className="cart-related-card"
                    onClick={() => navigate(`/product/${r.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && navigate(`/product/${r.id}`)
                    }
                  >
                    <div className="cart-related-thumb">
                      {r.image ? (
                        <img
                          src={getImageUrl(r.image)}
                          alt={r.name}
                          loading="lazy"
                        />
                      ) : (
                        <span>🌾</span>
                      )}
                    </div>
                    <h4>{r.name}</h4>
                    <p className="cart-related-price">₹{r.price ?? 0}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;