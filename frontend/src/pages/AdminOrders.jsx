// src/pages/AdminOrders.jsx
import { Fragment, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import { getImageUrl } from "../utils/image";
import "../Css/AdminOrders.css";

const ORDER_STATUSES = ["pending", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed"];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data } = await api.get("/payments");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, patch) => {
    const prev = orders;
    setOrders((o) => o.map((p) => (p.id === id ? { ...p, ...patch } : p)));

    try {
      await api.put(`/payments/${id}/status`, patch);
      toast.success("Order updated");
    } catch (err) {
      setOrders(prev);
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Update failed"
      );
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    const prev = orders;
    setOrders((o) => o.filter((p) => p.id !== id));
    try {
      await api.delete(`/payments/${id}`);
      toast.success("Order deleted");
    } catch (err) {
      setOrders(prev);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const visible = orders.filter((o) => {
    if (filter !== "all" && o.order_status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(o.id).includes(q) ||
      String(o.user_id ?? "").toLowerCase().includes(q) ||
      (o.full_name || "").toLowerCase().includes(q) ||
      (o.email || "").toLowerCase().includes(q) ||
      (o.phone || "").toLowerCase().includes(q) ||
      (o.payment_id || "").toLowerCase().includes(q)
    );
  });

  const stats = {
    all: orders.length,
    pending: orders.filter((o) => o.order_status === "pending").length,
    shipped: orders.filter((o) => o.order_status === "shipped").length,
    delivered: orders.filter((o) => o.order_status === "delivered").length,
    cancelled: orders.filter((o) => o.order_status === "cancelled").length,
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  const formatCurrency = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN")}`;

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="ao-page">
        <div className="ao-container">
          {/* Header */}
          <header className="ao-header">
            <div className="ao-header-left">
              <div className="ao-header-icon">📦</div>
              <div>
                <h1>Orders</h1>
                <p>
                  {orders.length} total · {visible.length} showing
                </p>
              </div>
            </div>
            <button
              className={`ao-refresh ${refreshing ? "is-refreshing" : ""}`}
              onClick={() => fetchOrders(true)}
              disabled={loading || refreshing}
              type="button"
            >
              <span className="refresh-icon">⟳</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          {/* Filters */}
          <div className="ao-toolbar">
            <div className="ao-search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="ao-search"
                placeholder="Search by ID, name, email, phone, payment ID…"
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

            <div className="ao-tabs">
              {["all", ...ORDER_STATUSES].map((s) => (
                <button
                  key={s}
                  className={`ao-tab ${filter === s ? "is-active" : ""}`}
                  onClick={() => setFilter(s)}
                  type="button"
                >
                  {s}
                  <span className="tab-count">{stats[s] ?? 0}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="ao-loading">
              <div className="ao-spinner" />
              <p>Loading orders…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="ao-empty">
              <div className="empty-icon">📭</div>
              <h3>No orders found</h3>
              <p>
                {search || filter !== "all"
                  ? "Try adjusting your search or filters."
                  : "Orders will appear here once customers place them."}
              </p>
            </div>
          ) : (
            <div className="ao-table-wrap">
              <table className="ao-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Placed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((o) => {
                    const isOpen = expanded === o.id;
                    const itemCount = Array.isArray(o.items)
                      ? o.items.length
                      : 0;

                    return (
                      <Fragment key={o.id}>
                        <tr className={isOpen ? "is-expanded" : ""}>
                          <td>
                            <span className="order-id">
                              #{String(o.id).padStart(5, "0")}
                            </span>
                            {o.user_id && (
                              <span className="user-id">
                                User: {o.user_id}
                              </span>
                            )}
                          </td>

                          <td>
                            <div className="cust-cell">
                              <strong>{o.full_name || "Guest"}</strong>
                              <span>{o.email || "—"}</span>
                              <span>{o.phone || "—"}</span>
                            </div>
                          </td>

                          <td>
                            <button
                              className="items-toggle"
                              onClick={() =>
                                setExpanded(isOpen ? null : o.id)
                              }
                              type="button"
                            >
                              {itemCount} item{itemCount === 1 ? "" : "s"}
                              <span className="chevron">
                                {isOpen ? "▲" : "▼"}
                              </span>
                            </button>
                          </td>

                          <td>
                            <div className="total-cell">
                              <strong>{formatCurrency(o.total)}</strong>
                              <span className="total-sub">
                                Sub {formatCurrency(o.subtotal)} · Ship{" "}
                                {formatCurrency(o.shipping)} · Tax{" "}
                                {formatCurrency(o.tax)}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div className="payment-cell">
                              <span
                                className={`badge badge-${String(
                                  o.payment_status
                                ).toLowerCase()}`}
                              >
                                {o.payment_status}
                              </span>
                              <span className="payment-meta">
                                {o.payment_mode?.toUpperCase() || "—"} ·{" "}
                                {o.payment_id
                                  ? o.payment_id.slice(0, 12) + "…"
                                  : "—"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <select
                              className={`status-select status-${o.order_status}`}
                              value={o.order_status}
                              onChange={(e) =>
                                updateStatus(o.id, {
                                  order_status: e.target.value,
                                })
                              }
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="date-cell">
                            {formatDate(o.createdAt || o.created_at)}
                          </td>

                          <td>
                            <button
                              className="btn-delete"
                              onClick={() => deleteOrder(o.id)}
                              title="Delete order"
                              type="button"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="detail-row">
                            <td colSpan={8}>
                              <div className="detail-panel">
                                <div className="detail-col">
                                  <h4>📍 Shipping Address</h4>
                                  <p>
                                    {o.address || "—"}
                                    <br />
                                    {o.city}
                                    {o.city && o.state ? ", " : ""}
                                    {o.state}
                                    <br />
                                    {o.pincode || ""}
                                  </p>
                                </div>

                                <div className="detail-col">
                                  <h4>💳 Payment Status</h4>
                                  <select
                                    className="status-select"
                                    value={o.payment_status}
                                    onChange={(e) =>
                                      updateStatus(o.id, {
                                        payment_status: e.target.value,
                                      })
                                    }
                                  >
                                    {PAYMENT_STATUSES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                  {o.payment_id && (
                                    <p className="payment-id">
                                      ID: {o.payment_id}
                                    </p>
                                  )}
                                </div>

                                <div className="detail-col items-col">
                                  <h4>🛍️ Items</h4>
                                  <ul className="items-list">
                                    {(o.items || []).map((it, idx) => (
                                      <li key={idx}>
                                        <div className="item-thumb">
                                          {it.image ? (
                                            <img
                                              src={
                                                typeof getImageUrl ===
                                                "function"
                                                  ? getImageUrl(it.image)
                                                  : it.image
                                              }
                                              alt={it.name}
                                              onError={(e) => {
                                                e.target.style.display =
                                                  "none";
                                              }}
                                            />
                                          ) : (
                                            <span>🌾</span>
                                          )}
                                        </div>
                                        <div className="item-info">
                                          <strong>{it.name}</strong>
                                          <span>
                                            {formatCurrency(it.price)} ×{" "}
                                            {it.quantity}
                                            {it.weight
                                              ? ` · ${it.weight}${
                                                  it.weightUnit || "g"
                                                }`
                                              : ""}
                                          </span>
                                        </div>
                                        <span className="item-total">
                                          {formatCurrency(
                                            (it.price || 0) *
                                              (it.quantity || 1)
                                          )}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
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

export default AdminOrders;