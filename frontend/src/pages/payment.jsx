// src/pages/Payment.jsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import UserNavbar from "../Navbar/UserNavbar";
import { getImageUrl } from "../utils/image";
import "../Css/payment.css";

const API = "http://localhost:7070/api";
const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        if (window.Razorpay) {
          clearInterval(interval);
          resolve(true);
        } else if (count > 40) {
          clearInterval(interval);
          resolve(false);
        }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = RAZORPAY_SCRIPT;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const readCart = () => {
  try {
    const raw = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const getToken = () => localStorage.getItem("token");

const authHeaders = (extra = {}) => {
  const h = { ...extra };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
};

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, options);
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      data?.message || data?.error || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

const PAYMENT_METHODS = [
  { id: "card", label: "Card", icon: "💳" },
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
];

const FREE_SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 40;
const TAX_RATE = 0.05;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const Payment = () => {
  const navigate = useNavigate();

  /* ---------------- Cart (re-syncs on cart-updated event) --------- */
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    const sync = () => setCart(readCart());
    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /* ---------------- Form state ------------------------------------ */
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    fullName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("card");

  /* ---------------- Processing / result state --------------------- */
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentId, setPaymentId] = useState("");
  const [orderId, setOrderId] = useState("");

  /* ---------------- Coupon state ---------------------------------- */
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  /* ---------------- Preload Razorpay script ----------------------- */
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  /* ---------------- Derived totals -------------------------------- */
  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.quantity || 1),
      0
    );
    const discount = Number(appliedCoupon?.discount || 0);
    const afterDiscount = Math.max(0, subtotal - discount);
    const shipping =
      afterDiscount > FREE_SHIPPING_THRESHOLD || afterDiscount === 0
        ? 0
        : SHIPPING_FEE;
    const tax = Math.round(afterDiscount * TAX_RATE);
    const grandTotal = Math.max(0, afterDiscount + shipping + tax);
    return { subtotal, discount, afterDiscount, shipping, tax, grandTotal };
  }, [cart, appliedCoupon]);

  /* ---------------- Form handlers --------------------------------- */
  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((p) => ({ ...p, [name]: value }));
      setErrors((p) => (p[name] ? { ...p, [name]: "" } : p));
    },
    []
  );

  const validate = useCallback(() => {
    const e = {};
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      e.email = "Enter a valid email";

    if (!formData.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, "")))
      e.phone = "Enter a valid 10-digit phone";

    if (!formData.fullName.trim()) e.fullName = "Full name is required";
    if (!formData.address.trim()) e.address = "Address is required";
    if (!formData.city.trim()) e.city = "City is required";
    if (!formData.state.trim()) e.state = "State is required";

    if (!formData.pincode.trim()) e.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(formData.pincode))
      e.pincode = "Enter a valid 6-digit pincode";

    return e;
  }, [formData]);

  /* ---------------- Payload builders ------------------------------ */
  const buildItems = useCallback(
    () =>
      cart.map((it) => ({
        product_id: it.id,
        name: it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        image: it.image || "",
        weight: it.weight ?? null,
        weightUnit: it.weightUnit ?? null,
        pcs: Number(it.pcs) || 0,
      })),
    [cart]
  );

  const buildOrderPayload = useCallback(
    (overrides = {}) => ({
      items: buildItems(),
      subtotal: totals.subtotal,
      discount: totals.discount,
      coupon_code: appliedCoupon?.code || null,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.grandTotal,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      ...overrides,
    }),
    [buildItems, totals, appliedCoupon, formData]
  );

  /* ---------------- Save order to backend ------------------------- */
  const saveOrder = useCallback(
    async (overrides) => {
      return apiFetch("/payments", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(buildOrderPayload(overrides)),
      });
    },
    [buildOrderPayload]
  );

  /* ---------------- Post-payment cleanup -------------------------- */
  const finalizeSuccess = useCallback(
    (savedOrder, pid) => {
      setPaymentId(pid);
      setOrderId(savedOrder.id);
      setOrderPlaced(true);
      localStorage.removeItem("cart");
      window.dispatchEvent(new Event("cart-updated"));
      setTimeout(() => navigate("/"), 4000);
    },
    [navigate]
  );

  /* ---------------- Coupon handlers ------------------------------- */
  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    setCouponError("");
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    setCouponLoading(true);
    try {
      const data = await apiFetch("/coupons/validate", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ code, subtotal: totals.subtotal }),
      });
      if (!data?.valid) throw new Error(data?.message || "Invalid coupon");
      setAppliedCoupon({
        code: data.code,
        type: data.type,
        value: data.value,
        discount: data.discount,
      });
      setCouponInput("");
      toast.success(`Coupon ${data.code} applied`);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || "Could not apply coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponInput("");
  };

  /* ---------------- COD flow -------------------------------------- */
  const handleCOD = async () => {
    const codId = `COD-${Date.now().toString().slice(-8)}`;
    const saved = await saveOrder({
      payment_mode: "cod",
      payment_id: codId,
      payment_status: "pending",
    });
    finalizeSuccess(saved, codId);
  };

  /* ---------------- Razorpay flow --------------------------------- */
  const handleRazorpay = async () => {
    const loaded = await loadRazorpayScript();
    if (!loaded) throw new Error("Could not load Razorpay. Check your network.");

    const createData = await apiFetch("/payments/create-order", {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        items: buildItems(),
        coupon_code: appliedCoupon?.code || null,
      }),
    });

    if (!createData?.keyId || !createData?.orderId) {
      throw new Error(
        createData?.message ||
          "Payment gateway initialization failed. Please try again."
      );
    }

    return new Promise((resolve, reject) => {
      const options = {
        key: createData.keyId,
        amount: createData.amount,
        currency: createData.currency || "INR",
        order_id: createData.orderId,
        name: "Gokul Namkeen",
        description: `Order of ${cart.length} item(s)`,
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
          coupon: appliedCoupon?.code || "",
        },
        theme: { color: "#16a34a" },

        handler: async (response) => {
          try {
            const verify = await apiFetch("/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verify?.success) {
              throw new Error("Payment signature verification failed");
            }

            const saved = await saveOrder({
              payment_mode: paymentMethod,
              payment_id: response.razorpay_payment_id,
              payment_status: "paid",
            });

            finalizeSuccess(saved, response.razorpay_payment_id);
            resolve(true);
          } catch (err) {
            console.error("post-payment error:", err);
            toast.error(err.message || "Payment done but order save failed");
            reject(err);
          }
        },

        modal: {
          ondismiss: () => {
            reject(new Error("Payment cancelled"));
          },
        },
      };

      if (!window.Razorpay) {
        reject(
          new Error("Razorpay SDK is not available. Please refresh the page.")
        );
        return;
      }

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (r) => {
        const msg =
          r?.error?.description || r?.error?.reason || "Payment failed";
        toast.error(msg);
        reject(new Error(msg));
      });

      rzp.open();
    });
  };

  /* ---------------- Submit ---------------------------------------- */
  const handleSubmit = async (e) => {
    e?.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      document
        .querySelector(".has-error")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Please fix the highlighted fields");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsProcessing(true);
    try {
      if (paymentMethod === "cod") {
        await handleCOD();
      } else {
        await handleRazorpay();
      }
    } catch (err) {
      // Razorpay dismissal / already-toasted errors — just reset
      if (err?.message && !/cancel/i.test(err.message)) {
        toast.error(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render: success                                                    */
  /* ------------------------------------------------------------------ */
  if (orderPlaced) {
    return (
      <>
        <UserNavbar />
        <div className="pay-page">
          <div className="pay-success">
            <div className="success-icon">✅</div>
            <h1>Order Placed Successfully</h1>
            <p>Thank you for your purchase.</p>

            <div className="success-details">
              {orderId && (
                <div className="success-row">
                  <span>Order ID</span>
                  <strong>#{String(orderId).padStart(6, "0")}</strong>
                </div>
              )}
              {paymentId && (
                <div className="success-row">
                  <span>Payment ID</span>
                  <strong>{paymentId}</strong>
                </div>
              )}
              <div className="success-row">
                <span>Total Paid</span>
                <strong>₹{totals.grandTotal.toLocaleString("en-IN")}</strong>
              </div>
              {appliedCoupon && (
                <div className="success-row">
                  <span>Coupon</span>
                  <strong>
                    {appliedCoupon.code} (−₹{totals.discount})
                  </strong>
                </div>
              )}
              <div className="success-row">
                <span>Email</span>
                <strong>{formData.email}</strong>
              </div>
            </div>

            <p className="redirect-note">Redirecting to home…</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/")}
              type="button"
            >
              Go to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: empty cart                                                 */
  /* ------------------------------------------------------------------ */
  if (cart.length === 0) {
    return (
      <>
        <UserNavbar />
        <div className="pay-page">
          <div className="pay-empty">
            <div className="empty-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products before checking out.</p>
            <button
              className="btn-primary"
              onClick={() => navigate("/product")}
              type="button"
            >
              Browse Products
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Render: main checkout                                              */
  /* ------------------------------------------------------------------ */
  return (
    <>
      <UserNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="pay-page">
        <div className="pay-container">
          <button
            className="pay-back"
            onClick={() => navigate(-1)}
            type="button"
          >
            ← Back
          </button>

          <header className="pay-header">
            <h1>Secure Checkout</h1>
            <p>Complete your order securely in a few steps</p>
          </header>

          <div className="pay-layout">
            {/* ----------- FORM ----------- */}
            <form className="pay-form" onSubmit={handleSubmit} noValidate>
              {/* 1. Contact */}
              <section className="pay-section">
                <h2>
                  <span className="step-num">1</span> Contact Information
                </h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">
                      Email <span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={errors.email ? "has-error" : ""}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <span className="error-msg">{errors.email}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">
                      Phone <span className="req">*</span>
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="10-digit number"
                      className={errors.phone ? "has-error" : ""}
                      autoComplete="tel"
                    />
                    {errors.phone && (
                      <span className="error-msg">{errors.phone}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* 2. Address */}
              <section className="pay-section">
                <h2>
                  <span className="step-num">2</span> Shipping Address
                </h2>

                <div className="form-group">
                  <label htmlFor="fullName">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={errors.fullName ? "has-error" : ""}
                    autoComplete="name"
                  />
                  {errors.fullName && (
                    <span className="error-msg">{errors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="address">
                    Address <span className="req">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House no., street, area"
                    className={errors.address ? "has-error" : ""}
                    autoComplete="street-address"
                  />
                  {errors.address && (
                    <span className="error-msg">{errors.address}</span>
                  )}
                </div>

                <div className="form-row three">
                  <div className="form-group">
                    <label htmlFor="city">
                      City <span className="req">*</span>
                    </label>
                    <input
                      id="city"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? "has-error" : ""}
                      autoComplete="address-level2"
                    />
                    {errors.city && (
                      <span className="error-msg">{errors.city}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">
                      State <span className="req">*</span>
                    </label>
                    <input
                      id="state"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={errors.state ? "has-error" : ""}
                      autoComplete="address-level1"
                    />
                    {errors.state && (
                      <span className="error-msg">{errors.state}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="pincode">
                      Pincode <span className="req">*</span>
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      name="pincode"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleChange}
                      className={errors.pincode ? "has-error" : ""}
                      autoComplete="postal-code"
                    />
                    {errors.pincode && (
                      <span className="error-msg">{errors.pincode}</span>
                    )}
                  </div>
                </div>
              </section>

              {/* 3. Coupon */}
              <section className="pay-section">
                <h2>
                  <span className="step-num">3</span> Discount
                </h2>

                {appliedCoupon ? (
                  <div className="coupon-applied">
                    <div className="coupon-info">
                      <span className="coupon-icon">🎟️</span>
                      <div>
                        <strong>{appliedCoupon.code}</strong>
                        <span>
                          {appliedCoupon.type === "percent"
                            ? `${appliedCoupon.value}% off`
                            : `₹${appliedCoupon.value} off`}{" "}
                          — saved ₹{appliedCoupon.discount}
                        </span>
                      </div>
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
                  <>
                    <div className="coupon-row">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        className={couponError ? "has-error" : ""}
                      />
                      <button
                        type="button"
                        className="coupon-apply"
                        onClick={applyCoupon}
                        disabled={couponLoading}
                      >
                        {couponLoading ? "…" : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <span className="error-msg">{couponError}</span>
                    )}
                    <p className="coupon-hint">
                      Try <code>WELCOME10</code> or <code>FLAT50</code>
                    </p>
                  </>
                )}
              </section>

              {/* 4. Payment method */}
              <section className="pay-section">
                <h2>
                  <span className="step-num">4</span> Payment Method
                </h2>
                <div className="pay-methods">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.id}
                      className={`pay-method ${
                        paymentMethod === m.id ? "active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={m.id}
                        checked={paymentMethod === m.id}
                        onChange={() => setPaymentMethod(m.id)}
                      />
                      <span className="method-icon">{m.icon}</span>
                      <span className="method-label">{m.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <button
                type="submit"
                className="place-order-btn"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="btn-spinner" />
                    Processing…
                  </>
                ) : paymentMethod === "cod" ? (
                  "Place Order (COD)"
                ) : (
                  `Pay ₹${totals.grandTotal.toLocaleString("en-IN")}`
                )}
              </button>
            </form>

            {/* ----------- SUMMARY ----------- */}
            <aside className="pay-summary">
              <h2>Order Summary</h2>

              <div className="summary-items">
                {cart.map((it, idx) => (
                  <div
                    key={it.cartKey ?? `${it.id}-${it.weight ?? ""}-${idx}`}
                    className="summary-item"
                  >
                    <div className="summary-thumb">
                      {it.image ? (
                        <img
                          src={getImageUrl(it.image)}
                          alt={it.name}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <span>🌾</span>
                      )}
                    </div>
                    <div className="summary-info">
                      <strong>{it.name}</strong>
                      <span>
                        Qty: {it.quantity || 1}
                        {it.weight != null && it.weight !== ""
                          ? ` · ${it.weight}${it.weightUnit || "g"}`
                          : ""}
                        {Number(it.pcs) > 0 ? ` · ${it.pcs} pcs` : ""}
                      </span>
                    </div>
                    <span className="summary-price">
                      ₹{Number(it.price || 0) * Number(it.quantity || 1)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>₹{totals.subtotal.toLocaleString("en-IN")}</span>
                </div>

                {appliedCoupon && (
                  <div className="total-row discount">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>−₹{totals.discount}</span>
                  </div>
                )}

                <div className="total-row">
                  <span>Shipping</span>
                  <span>
                    {totals.shipping === 0 ? (
                      <span className="free-ship">FREE</span>
                    ) : (
                      `₹${totals.shipping}`
                    )}
                  </span>
                </div>

                <div className="total-row">
                  <span>Tax (5%)</span>
                  <span>₹{totals.tax}</span>
                </div>

                <div className="total-row grand">
                  <span>Total</span>
                  <span>₹{totals.grandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {totals.afterDiscount > 0 &&
                totals.afterDiscount <= FREE_SHIPPING_THRESHOLD && (
                  <p className="ship-note">
                    Add ₹
                    {Math.ceil(FREE_SHIPPING_THRESHOLD - totals.afterDiscount)}{" "}
                    more for free shipping
                  </p>
                )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;