// src/pages/TrackOrder.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import UserNavbar from "../Navbar/UserNavbar";
import { getImageUrl } from "../utils/image";
import { useAuth } from "./AuthContext";
import "../Css/TrackOrder.css";

const STEP_ALIASES = {
  pending: "pending",
  confirmed: "processing",
  processing: "processing",
  shipped: "shipped",
  delivered: "delivered",
};

const ORDER_STEPS = [
  { key: "pending", label: "Placed", icon: "📝" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "shipped", label: "Shipped", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "✅" },
];

const TrackOrder = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast.error("Please login to view your orders");
      navigate("/login");
    }
  }, [user, navigate]);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (!user) return; // Don't fetch if not authenticated

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get("/payments/my-orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Poll every 30s, pause when tab hidden
  useEffect(() => {
    let id = null;

    const start = () => {
      if (id) return;
      id = setInterval(() => fetchOrders(true), 30000);
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        fetchOrders(true);
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchOrders]);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  const stepIndex = (status) => {
    const normalized = STEP_ALIASES[status] ?? status;
    return ORDER_STEPS.findIndex((s) => s.key === normalized);
  };

  const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <UserNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="to-page">
        <div className="to-container">
          {/* Header */}
          <header className="to-header">
            <div className="to-header-left">
              <div className="to-header-icon">📍</div>
              <div>
                <h1>Track My Orders</h1>
                <p>
                  {orders.length} order{orders.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <button
              className={`to-refresh ${refreshing ? "is-refreshing" : ""}`}
              onClick={() => fetchOrders(true)}
              disabled={loading || refreshing}
              type="button"
            >
              <span className="refresh-icon">⟳</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          {loading ? (
            <div className="to-loading">
              <div className="to-spinner" />
              <p>Loading your orders…</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="to-empty">
              <div className="empty-icon">📭</div>
              <h3>No orders yet</h3>
              <p>You haven’t placed any orders yet.</p>
              <button
                className="to-btn-primary"
                onClick={() => navigate("/product")}
                type="button"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="to-list">
              {orders.map((o) => {
                const isOpen = expanded === o.id;
                const rawIdx = stepIndex(o.order_status);
                const safeIdx = rawIdx < 0 ? 0 : rawIdx;
                const isCancelled = o.order_status === "cancelled";
                const itemCount = Array.isArray(o.items) ? o.items.length : 0;

                return (
                  <article
                    key={o.id}
                    className={`to-card ${isOpen ? "is-open" : ""} ${
                      isCancelled ? "is-cancelled" : ""
                    }`}
                  >
                    {/* Head */}
                    <div className="to-card-head">
                      <div className="to-order-info">
                        <span className="to-order-id">
                          Order <strong>#{String(o.id).padStart(5, "0")}</strong>
                        </span>
                        <span className="to-date">{formatDate(o.createdAt)}</span>
                      </div>
                      <span
                        className={`to-badge to-badge-${String(
                          o.order_status
                        ).toLowerCase()}`}
                      >
                        {o.order_status}
                      </span>
                    </div>

                    {/* Stepper */}
                    {!isCancelled ? (
                      <div className="to-stepper">
                        {ORDER_STEPS.map((step, i) => {
                          const done = safeIdx >= i;
                          const active = safeIdx === i;
                          return (
                            <div
                              key={step.key}
                              className={`to-step ${done ? "is-done" : ""} ${
                                active ? "is-active" : ""
                              }`}
                            >
                              <div className="to-step-dot">
                                {done ? "✓" : step.icon}
                              </div>
                              <div className="to-step-label">{step.label}</div>
                              {i < ORDER_STEPS.length - 1 && (
                                <div
                                  className={`to-step-line ${
                                    safeIdx > i ? "is-done" : ""
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="to-cancelled">
                        This order was cancelled.
                      </div>
                    )}

                    {/* Summary */}
                    <div className="to-summary">
                      <div className="to-summary-item">
                        <span className="to-label">Total</span>
                        <strong>{money(o.total)}</strong>
                      </div>
                      <div className="to-summary-item">
                        <span className="to-label">Items</span>
                        <strong>{itemCount}</strong>
                      </div>
                      <div className="to-summary-item">
                        <span className="to-label">Payment</span>
                        <strong>
                          {o.payment_mode?.toUpperCase() || "—"}
                        </strong>
                      </div>
                      <button
                        className="to-toggle-btn"
                        onClick={() => setExpanded(isOpen ? null : o.id)}
                        type="button"
                      >
                        {isOpen ? "Hide details ▲" : "View details ▼"}
                      </button>
                    </div>

                    {/* Details */}
                    {isOpen && (
                      <div className="to-detail">
                        <div className="to-col">
                          <h4>📍 Shipping Address</h4>
                          <p>
                            <strong>{o.full_name}</strong>
                            <br />
                            {o.address}
                            <br />
                            {o.city}
                            {o.city && o.state ? ", " : ""}
                            {o.state}
                            <br />
                            {o.pincode}
                            <br />
                            <span className="to-contact">
                              📞 {o.phone}
                              <br />
                              ✉️ {o.email}
                            </span>
                          </p>
                        </div>

                        <div className="to-col">
                          <h4>💳 Payment</h4>
                          <p>
                            Status:{" "}
                            <span
                              className={`to-badge to-badge-${String(
                                o.payment_status
                              ).toLowerCase()}`}
                            >
                              {o.payment_status}
                            </span>
                            <br />
                            Mode: {o.payment_mode?.toUpperCase() || "—"}
                            <br />
                            Txn:{" "}
                            <code className="to-txn">
                              {o.payment_id || "—"}
                            </code>
                          </p>
                          <div className="to-breakdown">
                            <div>
                              <span>Subtotal</span>
                              <span>{money(o.subtotal)}</span>
                            </div>
                            <div>
                              <span>Shipping</span>
                              <span>{money(o.shipping)}</span>
                            </div>
                            <div>
                              <span>Tax</span>
                              <span>{money(o.tax)}</span>
                            </div>
                            <div className="to-total-row">
                              <span>Total</span>
                              <span>{money(o.total)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="to-col to-items-col">
                          <h4>🛍️ Items ({itemCount})</h4>
                          <ul className="to-items-list">
                            {(o.items || []).map((it, i) => (
                              <li key={i}>
                                <div className="to-item-thumb">
                                  {it.image ? (
                                    <img
                                      src={
                                        typeof getImageUrl === "function"
                                          ? getImageUrl(it.image)
                                          : it.image
                                      }
                                      alt={it.name}
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <span>🌾</span>
                                  )}
                                </div>
                                <div className="to-item-info">
                                  <strong>{it.name}</strong>
                                  <span>
                                    {money(it.price)} × {it.quantity}
                                    {it.weight
                                      ? ` · ${it.weight}${
                                          it.weightUnit || "g"
                                        }`
                                      : ""}
                                  </span>
                                </div>
                                <span className="to-item-total">
                                  {money(
                                    (it.price || 0) * (it.quantity || 1)
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TrackOrder;