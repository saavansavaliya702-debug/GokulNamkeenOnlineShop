// src/pages/AdminDashboard.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import { getImageUrl } from "../utils/image";
import "../Css/adminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Guard: only admins
  useEffect(() => {
    if (user && !user.is_admin) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Helper: safely unwrap arrays from various response shapes
  const asArray = (val) => {
    if (Array.isArray(val)) return val;
    if (val?.data?.products && Array.isArray(val.data.products))
      return val.data.products;
    if (val?.data && Array.isArray(val.data)) return val.data;
    if (val?.products && Array.isArray(val.products)) return val.products;
    if (val?.items && Array.isArray(val.items)) return val.items;
    if (val?.results && Array.isArray(val.results)) return val.results;
    return [];
  };

  // Helper: compute total stock from a product (variants-aware)
  const computeStock = (p) => {
    if (Array.isArray(p.variants) && p.variants.length > 0) {
      return p.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
    }
    return Number(p.stock ?? p.stock_quantity ?? 0);
  };

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.allSettled([
      api.get("/admin/dashboard/stats"),
      api.get("/admin/dashboard/recent-orders"),
      api.get("/admin/dashboard/low-stock"),
      api.get("/admin/dashboard/revenue-chart"),
      api.get("/admin/dashboard/top-products"),
    ]);

    const [statsRes, ordersRes, stockRes, revenueRes, topRes] = results;

    if (statsRes.status === "fulfilled") {
      setStats(statsRes.value.data);
    } else {
      console.error("stats failed:", statsRes.reason);
    }

    if (ordersRes.status === "fulfilled") {
      setRecentOrders(asArray(ordersRes.value.data));
    } else {
      console.error("orders failed:", ordersRes.reason);
    }

    if (revenueRes.status === "fulfilled") {
      setRevenueData(asArray(revenueRes.value.data));
    } else {
      console.error("revenue failed:", revenueRes.reason);
    }

    if (topRes.status === "fulfilled") {
      setTopProducts(asArray(topRes.value.data));
    } else {
      console.error("top-products failed:", topRes.reason);
    }

    // -------- Low stock with fallback --------
    let lowStockList = [];

    if (stockRes.status === "fulfilled") {
      const raw = stockRes.value.data;
      console.log("low-stock raw response:", raw);
      lowStockList = asArray(raw);
    } else {
      console.error("low-stock failed:", stockRes.reason);
    }

    // If backend returned nothing, compute client-side from /products
    if (lowStockList.length === 0) {
      try {
        const { data: allProducts } = await api.get("/products?all=true");
        const products = asArray(allProducts);

        lowStockList = products
          .map((p) => ({ ...p, _stock: computeStock(p) }))
          .filter((p) => p._stock > 0 && p._stock <= 10)
          .map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            image: p.image,
            price: p.price,
            stock_quantity: p._stock,
          }));

        console.log("computed low stock from /products:", lowStockList);
      } catch (e) {
        console.error("fallback low-stock computation failed:", e);
      }
    }

    // Normalize fields so the render never breaks on renamed keys
    const normalizedLowStock = lowStockList.map((p) => {
      const variants = Array.isArray(p.variants) ? p.variants : [];
      const totalStock = variants.length
        ? variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)
        : Number(p.stock_quantity ?? p.stock ?? p._stock ?? 0);

      return {
        id: p.id ?? p._id,
        name: p.name ?? p.product_name ?? "Unnamed",
        category: p.category ?? p.category_name ?? "",
        image: p.image ?? p.image_url ?? "",
        price: Number(p.price ?? p.selling_price ?? 0),
        stock_quantity: totalStock,
      };
    });

    setLowStock(normalizedLowStock);

    const anyFailed = results.some((r) => r.status === "rejected");
    if (anyFailed) toast.error("Some dashboard data failed to load");

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const onFocus = () => fetchAll(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAll]);

  // Helpers
  const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusClass = (status) => {
    const map = {
      pending: "badge-pending",
      confirmed: "badge-processing",
      processing: "badge-processing",
      shipped: "badge-shipped",
      delivered: "badge-delivered",
      completed: "badge-delivered",
      cancelled: "badge-cancelled",
    };
    return map[status] || "badge-pending";
  };

  const maxRevenue =
    revenueData.length > 0
      ? Math.max(...revenueData.map((d) => Number(d.revenue) || 0))
      : 1;

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="dash-page">
          <div className="dash-loading">
            <div className="dash-spinner" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="dash-page">
        {/* Header */}
        <header className="dash-header">
          <div className="dash-header-text">
            <h1>
              Welcome back,{" "}
              <span className="dash-username">{user?.name || "Admin"}</span>{" "}
              <span className="dash-wave">👋</span>
            </h1>
            <p>Here’s what’s happening with your store today</p>
          </div>
          <button
            className={`dash-refresh-btn ${refreshing ? "is-refreshing" : ""}`}
            onClick={() => fetchAll(true)}
            disabled={refreshing}
          >
            <span className="refresh-icon">🔄</span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Stats */}
        <section className="dash-stats">
          <div className="dash-stat-card revenue">
            <div className="dash-stat-icon">💰</div>
            <div className="dash-stat-body">
              <span className="dash-stat-label">Total Revenue</span>
              <span className="dash-stat-value">
                {formatCurrency(stats?.revenue?.total)}
              </span>
              <span className="dash-stat-sub">
                Today: {formatCurrency(stats?.revenue?.today)}
              </span>
            </div>
          </div>

          <div className="dash-stat-card orders">
            <div className="dash-stat-icon">📦</div>
            <div className="dash-stat-body">
              <span className="dash-stat-label">Total Orders</span>
              <span className="dash-stat-value">
                {stats?.orders?.total || 0}
              </span>
              <span className="dash-stat-sub">
                {stats?.orders?.pending || 0} pending ·{" "}
                {stats?.orders?.shipped || 0} shipped
              </span>
            </div>
          </div>

          <div className="dash-stat-card products">
            <div className="dash-stat-icon">🛍️</div>
            <div className="dash-stat-body">
              <span className="dash-stat-label">Products</span>
              <span className="dash-stat-value">
                {stats?.products?.total || 0}
              </span>
              <span className="dash-stat-sub">
                {stats?.products?.active || 0} active
              </span>
            </div>
          </div>

          <div className="dash-stat-card customers">
            <div className="dash-stat-icon">👥</div>
            <div className="dash-stat-body">
              <span className="dash-stat-label">Customers</span>
              <span className="dash-stat-value">
                {stats?.customers?.total || 0}
              </span>
              <span className="dash-stat-sub">Registered users</span>
            </div>
          </div>
        </section>

        {/* Alerts */}
        {(stats?.products?.lowStock > 0 || stats?.products?.outOfStock > 0) && (
          <section className="dash-alerts">
            {stats.products.outOfStock > 0 && (
              <button
                className="dash-alert danger"
                onClick={() => navigate("/record")}
              >
                <span className="alert-icon">⚠️</span>
                <div className="alert-text">
                  <strong>
                    {stats.products.outOfStock} products out of stock
                  </strong>
                  <span>Restock them soon to avoid losing sales</span>
                </div>
                <span className="alert-arrow">→</span>
              </button>
            )}
            {stats.products.lowStock > 0 && (
              <button
                className="dash-alert warn"
                onClick={() => navigate("/record")}
              >
                <span className="alert-icon">🔔</span>
                <div className="alert-text">
                  <strong>
                    {stats.products.lowStock} products low in stock
                  </strong>
                  <span>Consider restocking soon</span>
                </div>
                <span className="alert-arrow">→</span>
              </button>
            )}
          </section>
        )}

        {/* Main Grid */}
        <div className="dash-grid">
          {/* Revenue Chart */}
          <div className="dash-card chart-card">
            <div className="dash-card-header">
              <h2>📈 Revenue (Last 7 Days)</h2>
              <span className="dash-card-tag">
                {formatCurrency(
                  revenueData.reduce((s, d) => s + Number(d.revenue || 0), 0)
                )}
              </span>
            </div>

            {revenueData.length === 0 ? (
              <div className="dash-empty">No revenue data yet</div>
            ) : (
              <div className="dash-chart">
                {revenueData.map((d, i) => {
                  const height = (Number(d.revenue || 0) / maxRevenue) * 100;
                  return (
                    <div key={i} className="chart-bar-wrap">
                      <div className="chart-tooltip">
                        {formatCurrency(d.revenue)}
                        <br />
                        {d.orders || 0} orders
                      </div>
                      <div
                        className="chart-bar"
                        style={{ height: `${Math.max(height, 4)}%` }}
                      />
                      <div className="chart-label">
                        {new Date(d.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>🏆 Top Products</h2>
              <span className="dash-card-tag">{topProducts.length} items</span>
            </div>

            {topProducts.length === 0 ? (
              <div className="dash-empty">No sales yet</div>
            ) : (
              <ul className="top-list">
                {topProducts.map((p, i) => (
                  <li key={p.id} className="top-item">
                    <span className="top-rank">{i + 1}</span>
                    <div className="top-img">
                      {p.image ? (
                        <img
                          src={
                            typeof getImageUrl === "function"
                              ? getImageUrl(p.image)
                              : p.image
                          }
                          alt={p.name}
                        />
                      ) : (
                        <span>🌾</span>
                      )}
                    </div>
                    <div className="top-info">
                      <strong>{p.name}</strong>
                      <span>{p.total_sold} sold</span>
                    </div>
                    <span className="top-revenue">
                      {formatCurrency(p.total_revenue)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Orders */}
          <div className="dash-card full">
            <div className="dash-card-header">
              <h2>📋 Recent Orders</h2>
              <button
                className="dash-view-all"
                onClick={() => navigate("/order")}
              >
                View All →
              </button>
            </div>

            {recentOrders.length === 0 ? (
              <div className="dash-empty">No orders yet</div>
            ) : (
              <div className="table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className="order-id">
                            #{String(o.id).padStart(5, "0")}
                          </span>
                        </td>
                        <td>
                          <div className="cust-cell">
                            <strong>{o.customer_name || "Guest"}</strong>
                            <span>{o.customer_email || "—"}</span>
                          </div>
                        </td>
                        <td>
                          <span className="amount">
                            {formatCurrency(o.total_amount)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusClass(o.status)}`}>
                            {o.status}
                          </span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <span>{formatDate(o.created_at)}</span>
                            <small>{formatTime(o.created_at)}</small>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Low Stock */}
          <div className="dash-card full">
            <div className="dash-card-header">
              <h2>⚠️ Low Stock Products</h2>
              <button
                className="dash-view-all"
                onClick={() => navigate("/record")}
              >
                Manage →
              </button>
            </div>

            {lowStock.length === 0 ? (
              <div className="dash-empty success">
                ✅ All products are well-stocked
                <br />
                <small style={{ color: "#94a3b8" }}>
                  Checked for products with 1–10 units remaining
                </small>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div className="thumb">
                            {p.image ? (
                              <img
                                src={
                                  typeof getImageUrl === "function"
                                    ? getImageUrl(p.image)
                                    : p.image
                                }
                                alt={p.name}
                              />
                            ) : (
                              "🌾"
                            )}
                          </div>
                        </td>
                        <td>
                          <strong>{p.name}</strong>
                        </td>
                        <td>
                          <span className="cat-tag">
                            {p.category || "Uncategorized"}
                          </span>
                        </td>
                        <td>
                          <span className="amount">
                            {formatCurrency(p.price)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              p.stock_quantity === 0
                                ? "badge-cancelled"
                                : "badge-pending"
                            }`}
                          >
                            {p.stock_quantity === 0
                              ? "Out of stock"
                              : `${p.stock_quantity} left`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <section className="dash-actions">
          <h2>⚡ Quick Actions</h2>
          <div className="actions-grid">
            <button
              className="action-btn"
              onClick={() => navigate("/addproduct")}
            >
              <span className="action-icon">➕</span>
              <span>Add Product</span>
            </button>
            <button className="action-btn" onClick={() => navigate("/order")}>
              <span className="action-icon">📦</span>
              <span>View Orders</span>
            </button>
            <button className="action-btn" onClick={() => navigate("/record")}>
              <span className="action-icon">📋</span>
              <span>Manage Records</span>
            </button>
            <button className="action-btn" onClick={() => navigate("/")}>
              <span className="action-icon">🏠</span>
              <span>Go to Store</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default AdminDashboard;