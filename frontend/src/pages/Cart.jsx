// src/pages/Cart.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import UserNavbar from "../Navbar/UserNavbar";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import { getImageUrl } from "../utils/image";
import "../Css/Cart.css";

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

  const persist = (next) => {
    localStorage.setItem("cart", JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
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
    toast.success("Cart cleared");
  };

  const cartCount = cart.reduce((s, it) => s + (it.quantity || 1), 0);
  const subtotal = cart.reduce(
    (s, it) => s + it.price * (it.quantity || 1),
    0
  );
  const shipping = subtotal > 500 ? 0 : subtotal > 0 ? 40 : 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <>
      {user?.is_admin ? <AdminNavbar /> : <UserNavbar />}
      <Toaster position="top-right" toastOptions={{ duration: 2500 }} />

      <div className="cart-page">
        <div className="cart-container">
          <button
            className="cart-back"
            onClick={() => navigate(-1)}
            type="button"
          >
            ← Back
          </button>

          <header className="cart-header">
            <div>
              <h1>Your Cart</h1>
              <p>
                {cartCount === 0
                  ? "No items yet"
                  : `${cartCount} item${cartCount !== 1 ? "s" : ""} in cart`}
              </p>
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
                  <div key={item.cartKey} className="cart-row">
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
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
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
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;