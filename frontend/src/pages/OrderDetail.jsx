// src/pages/OrderDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import { getImageUrl } from "../utils/image";
import "../Css/OrderDetail.css";

const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/payments/${id}`);
      setOrder(data);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load order"
      );
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const updateStatus = async (patch) => {
    if (!order) return;
    setUpdating(true);

    const prev = order;
    setOrder({ ...order, ...patch });

    try {
      await api.put(`/payments/${order.id}/status`, patch);
      toast.success("Order updated");
    } catch (err) {
      setOrder(prev);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Update failed"
      );
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN")}`;

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="od-page">
          <div className="od-loading">
            <div className="od-spinner" />
            <p>Loading order…</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AdminNavbar />
        <div className="od-page">
          <div className="od-empty">
            <div className="empty-icon">📭</div>
            <h3>Order not found</h3>
            <button
              className="od-btn od-btn-secondary"
              onClick={() => navigate(-1)}
            >
              ← Go back
            </button>
          </div>
        </div>
      </>
    );
  }

  const paymentFailed = order.payment_status === "failed";

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="od-page">
        <div className="od-container">
          {/* Header */}
          <header className="od-header">
            <button
              className="od-back"
              onClick={() => navigate(-1)}
              type="button"
            >
              ← Back
            </button>
            <div className="od-header-main">
              <div className="od-header-icon">📦</div>
              <div>
                <span className="od-badge">Order Details</span>
                <h1>
                  Order #{String(order.id).padStart(5, "0")}
                </h1>
                <p>Placed on {formatDate(order.createdAt || order.created_at)}</p>
              </div>
            </div>
            <button
              className="od-refresh"
              onClick={fetchOrder}
              type="button"
            >
              🔄 Refresh
            </button>
          </header>

          {/* Status strip */}
          <div className="od-status-strip">
            <div className="od-status-item">
              <span className="label">Payment</span>
              <select
                className={`od-select status-${order.payment_status}`}
                value={order.payment_status}
                disabled={updating}
                onChange={(e) =>
                  updateStatus({ payment_status: e.target.value })
                }
              >
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="od-status-item">
              <span className="label">Order Status</span>
              <select
                className={`od-select status-${order.order_status}`}
                value={order.order_status}
                disabled={updating}
                onChange={(e) =>
                  updateStatus({ order_status: e.target.value })
                }
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="od-status-item">
              <span className="label">Total</span>
              <strong className="od-total">
                {formatCurrency(order.total)}
              </strong>
            </div>
          </div>

          {/* Main grid */}
          <div className="od-grid">
            {/* Customer */}
            <section className="od-card">
              <h2>👤 Customer</h2>
              <dl className="od-dl">
                <dt>Name</dt>
                <dd>{order.full_name || "Guest"}</dd>
                <dt>Email</dt>
                <dd>
                  {order.email ? (
                    <a href={`mailto:${order.email}`}>{order.email}</a>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>Phone</dt>
                <dd>
                  {order.phone ? (
                    <a href={`tel:${order.phone}`}>{order.phone}</a>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>User ID</dt>
                <dd className="mono">{order.user_id ?? "—"}</dd>
              </dl>
            </section>

            {/* Shipping */}
            <section className="od-card">
              <h2>📍 Shipping Address</h2>
              <address className="od-address">
                {order.address || "—"}
                <br />
                {order.city}
                {order.city && order.state ? ", " : ""}
                {order.state}
                <br />
                {order.pincode || ""}
                <br />
                {order.country || "India"}
              </address>
            </section>

            {/* Payment */}
            <section className="od-card">
              <h2>💳 Payment Info</h2>
              <dl className="od-dl">
                <dt>Status</dt>
                <dd>
                  <span
                    className={`od-pill status-${order.payment_status}`}
                  >
                    {order.payment_status}
                  </span>
                </dd>
                <dt>Mode</dt>
                <dd>{order.payment_mode?.toUpperCase() || "—"}</dd>
                <dt>Payment ID</dt>
                <dd className="mono">{order.payment_id || "—"}</dd>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(order.subtotal)}</dd>
                <dt>Shipping</dt>
                <dd>{formatCurrency(order.shipping)}</dd>
                <dt>Tax</dt>
                <dd>{formatCurrency(order.tax)}</dd>
                <dt className="od-dl-total">Total</dt>
                <dd className="od-dl-total">
                  <strong>{formatCurrency(order.total)}</strong>
                </dd>
              </dl>
            </section>

            {/* Timeline */}
            <section className="od-card">
              <h2>🕒 Timeline</h2>
              <dl className="od-dl">
                <dt>Placed</dt>
                <dd>{formatDate(order.createdAt || order.created_at)}</dd>
                <dt>Updated</dt>
                <dd>{formatDate(order.updatedAt || order.updated_at)}</dd>
              </dl>
            </section>

            {/* Items — full width */}
            <section className="od-card full">
              <h2>🛍️ Items ({order.items?.length || 0})</h2>

              {!order.items || order.items.length === 0 ? (
                <p className="od-empty-items">No items in this order.</p>
              ) : (
                <ul className="od-items">
                  {order.items.map((it, idx) => (
                    <li key={idx} className="od-item">
                      <div className="od-item-thumb">
                        {it.image ? (
                          <img
                            src={
                              typeof getImageUrl === "function"
                                ? getImageUrl(it.image)
                                : it.image
                            }
                            alt={it.name}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>🌾</span>
                        )}
                      </div>
                      <div className="od-item-info">
                        <strong>{it.name}</strong>
                        <span>
                          {formatCurrency(it.price)} × {it.quantity}
                          {it.weight
                            ? ` · ${it.weight}${it.weightUnit || "g"}`
                            : ""}
                        </span>
                      </div>
                      <span className="od-item-total">
                        {formatCurrency(
                          (it.price || 0) * (it.quantity || 1)
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Raw fields — for admins who want everything */}
            <section className="od-card full">
              <h2>🔍 All Fields</h2>
              <div className="od-raw">
                {Object.entries(order).map(([key, value]) => {
                  if (key === "items") return null;
                  let display;
                  if (value == null) display = "—";
                  else if (typeof value === "object")
                    display = JSON.stringify(value);
                  else display = String(value);

                  return (
                    <div className="od-raw-row" key={key}>
                      <span className="od-raw-key">{key}</span>
                      <span className="od-raw-value">{display}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;