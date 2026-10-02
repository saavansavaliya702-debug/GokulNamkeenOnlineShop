// src/pages/AdminCustomerPage.jsx
import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import BackButton from "../components/BackButton";
import { API_URL } from "../config/api";
import "../Css/AdminCustomerPage.css";

const API = `${API_URL}/admin`;

const getErrMsg = (err) =>
  err?.response?.data?.error || err?.message || "Unknown error";

export default function AdminCustomerPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [lostUsers, setLostUsers] = useState([]);
  const [customerItems, setCustomerItems] = useState([]);
  const [inactiveDays, setInactiveDays] = useState(30);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadingLost, setLoadingLost] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);

  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState("users");
  const [userSearch, setUserSearch] = useState("");
  const [itemsSearch, setItemsSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState(null);

  /* Admin guard */
  useEffect(() => {
    if (user && !user.is_admin) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /* Users */
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setLoadingUsers(true);
    axios
      .get(`${API}/users`)
      .then((res) => mounted && setUsers(res.data || []))
      .catch((err) => mounted && setError(getErrMsg(err)))
      .finally(() => mounted && setLoadingUsers(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  /* Feedback */
  const loadFeedback = useCallback(() => {
    if (!user) return Promise.resolve();
    setLoadingFeedback(true);
    return axios
      .get(`${API}/feedback`)
      .then((res) => setFeedback(res.data || []))
      .catch((err) => setError(getErrMsg(err)))
      .finally(() => setLoadingFeedback(false));
  }, [user]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  /* Lost users */
  const loadLostUsers = useCallback(
    (days) => {
      if (!user) return Promise.resolve();
      setLoadingLost(true);
      return axios
        .get(`${API}/lost-users?days=${days}`)
        .then((res) => setLostUsers(res.data?.users || []))
        .catch((err) => setError(getErrMsg(err)))
        .finally(() => setLoadingLost(false));
    },
    [user]
  );

  useEffect(() => {
    loadLostUsers(inactiveDays);
  }, [loadLostUsers, inactiveDays]);

  /* Customer items */
  const loadCustomerItems = useCallback(() => {
    if (!user) return Promise.resolve();
    setLoadingItems(true);
    return axios
      .get(`${API}/customer-items`)
      .then((res) => setCustomerItems(res.data || []))
      .catch((err) => setError(getErrMsg(err)))
      .finally(() => setLoadingItems(false));
  }, [user]);

  useEffect(() => {
    loadCustomerItems();
  }, [loadCustomerItems]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        loadFeedback(),
        loadLostUsers(inactiveDays),
        loadCustomerItems(),
      ]);
      toast.success("Data refreshed");
    } catch (err) {
      toast.error("Refresh failed: " + getErrMsg(err));
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Mark this user as deleted?")) return;
    try {
      await axios.delete(`${API}/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setLostUsers((prev) => prev.filter((u) => u.id !== id));
      setCustomerItems((prev) => prev.filter((u) => u.id !== id));
      toast.success("User removed");
    } catch (err) {
      toast.error("Failed: " + getErrMsg(err));
    }
  };

  const handleDeleteFeedback = async (id) => {
    if (!window.confirm("Delete this feedback message?")) return;
    try {
      await axios.delete(`${API}/feedback/${id}`);
      setFeedback((prev) => prev.filter((f) => f.id !== id));
      toast.success("Feedback deleted");
    } catch (err) {
      toast.error("Failed: " + getErrMsg(err));
    }
  };

  const fmt = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d.getTime())
      ? "—"
      : d.toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
  };

  const daysSince = (val) => {
    if (!val) return "Never ordered";
    const diff = Math.floor((Date.now() - new Date(val)) / 86400000);
    return `${diff} day${diff !== 1 ? "s" : ""} ago`;
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        String(u.id).includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredCustomerItems = useMemo(() => {
    const q = itemsSearch.trim().toLowerCase();
    if (!q) return customerItems;
    return customerItems.filter(
      (u) =>
        String(u.id).includes(q) ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [customerItems, itemsSearch]);

  const stats = useMemo(
    () => ({
      totalUsers: users.length,
      totalFeedback: feedback.length,
      lostCount: lostUsers.length,
      totalSpenders: customerItems.length,
    }),
    [users, feedback, lostUsers, customerItems]
  );

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="acp-page">
        <div className="acp-container">
          {/* Header */}
          <header className="acp-header">
            <div className="acp-header-left">
              <BackButton to="/dashboard" />
              <div className="acp-header-icon">👥</div>
              <div>
                <h1>Customer Dashboard</h1>
                <p>Manage users, feedback and purchases</p>
              </div>
            </div>
            <button
              className={`acp-refresh ${refreshing ? "is-refreshing" : ""}`}
              onClick={handleRefresh}
              disabled={refreshing}
              type="button"
            >
              <span className="refresh-icon">⟳</span>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </header>

          {/* Error */}
          {error && (
            <div className="acp-error">
              <span>⚠</span>
              <span>{error}</span>
              <button onClick={() => setError(null)} type="button">
                ✕
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="acp-stats">
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              variant="blue"
              icon="👥"
            />
            <StatCard
              label="Feedback"
              value={stats.totalFeedback}
              variant="green"
              icon="💬"
            />
            <StatCard
              label={`Lost (>${inactiveDays}d)`}
              value={stats.lostCount}
              variant="red"
              icon="⚠️"
            />
            <StatCard
              label="Buyers"
              value={stats.totalSpenders}
              variant="amber"
              icon="🛒"
            />
          </div>

          {/* Tabs */}
          <div className="acp-tabs" role="tablist">
            {[
              { key: "users", label: "Users", count: users.length },
              { key: "feedback", label: "Feedback", count: feedback.length },
              { key: "lost", label: "Lost Users", count: lostUsers.length },
             
            ].map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                className={`acp-tab ${activeTab === t.key ? "active" : ""}`}
                onClick={() => setActiveTab(t.key)}
                type="button"
              >
                {t.label}
                <span className="tab-count">{t.count}</span>
              </button>
            ))}
          </div>

          {/* USERS */}
          {activeTab === "users" && (
            <section className="acp-card">
              <div className="acp-card-header">
                <h2>
                  All Users
                  <span className="section-sub">
                    {filteredUsers.length} shown
                  </span>
                </h2>
                <div className="acp-search-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    className="acp-search"
                    placeholder="Search by name, email, or ID…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  {userSearch && (
                    <button
                      className="search-clear"
                      onClick={() => setUserSearch("")}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {loadingUsers ? (
                <Spinner label="Loading users…" />
              ) : filteredUsers.length === 0 ? (
                <EmptyState icon="🔍" text="No users found." />
              ) : (
                <div className="acp-table-wrap">
                  <table className="acp-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Verified</th>
                        <th>Orders</th>
                        <th>Items</th>
                        <th>Spent</th>
                        <th>Last Order</th>
                        <th>Joined</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => {
                        const customerData = customerItems.find(
                          (c) => c.id === u.id
                        );
                        const isOpen = expandedUser === u.id;
                        const itemsList = customerData?.items || [];

                        return (
                          <Fragment key={u.id}>
                            <tr>
                              <td className="mono">{u.id}</td>
                              <td>
                                <div className="name-cell">
                                  <Avatar name={u.name || u.email} />
                                  <strong>{u.name || "—"}</strong>
                                </div>
                              </td>
                              <td className="muted">{u.email}</td>
                              <td>
                                <span
                                  className={`dot ${
                                    u.is_verified ? "ok" : "no"
                                  }`}
                                  title={
                                    u.is_verified ? "Verified" : "Unverified"
                                  }
                                />
                              </td>
                              <td>
                                <span className="badge blue">
                                  {u.order_count ?? 0}
                                </span>
                              </td>
                              <td>
                                <span className="badge green">
                                  {customerData?.itemsCount ?? 0}
                                </span>
                              </td>
                              <td className="muted">
                                ₹
                                {Number(
                                  customerData?.amountSpent || 0
                                ).toLocaleString("en-IN")}
                              </td>
                              <td className="muted">
                                {u.last_order_at
                                  ? fmt(u.last_order_at)
                                  : "Never"}
                              </td>
                              <td className="muted">{fmt(u.createdAt)}</td>
                              <td>
                                <div className="action-btns">
                                  {itemsList.length > 0 && (
                                    <button
                                      className="btn-ghost"
                                      onClick={() =>
                                        setExpandedUser(isOpen ? null : u.id)
                                      }
                                      type="button"
                                      title="View items"
                                    >
                                      {isOpen ? "▲" : "▼"}
                                    </button>
                                  )}
                                  <button
                                    className="btn-danger"
                                    onClick={() => handleDeleteUser(u.id)}
                                    type="button"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isOpen && itemsList.length > 0 && (
                              <tr className="expand-row">
                                <td colSpan={10}>
                                  <div className="items-panel">
                                    <h4>🛒 Purchased Items</h4>
                                    <div className="items-grid">
                                      {itemsList.map((item, idx) => (
                                        <div key={idx} className="item-chip">
                                          <span className="item-name">
                                            {item.name}
                                          </span>
                                          <span className="item-meta">
                                            Qty: {item.qty} · ₹{item.price}
                                          </span>
                                          <span className="item-total">
                                            Total: ₹
                                            {Number(
                                              item.totalSpent || 0
                                            ).toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      ))}
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
            </section>
          )}

          {/* FEEDBACK */}
          {activeTab === "feedback" && (
            <section className="acp-card">
              <div className="acp-card-header">
                <h2>
                  Feedback
                  <span className="section-sub">
                    {feedback.length} message
                    {feedback.length !== 1 ? "s" : ""}
                  </span>
                </h2>
              </div>

              {loadingFeedback ? (
                <Spinner label="Loading feedback…" />
              ) : feedback.length === 0 ? (
                <EmptyState icon="💬" text="No feedback yet." />
              ) : (
                <ul className="feedback-list">
                  {feedback.map((f) => (
                    <li key={f.id} className="feedback-item">
                      <div className="feedback-top">
                        <Avatar name={f.user?.name || f.user?.email} />
                        <div className="feedback-sender">
                          <div className="sender-line">
                            <strong>{f.user?.name || "Unknown"}</strong>
                            {f.user?.is_verified && (
                              <span className="verified-chip">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                          {f.user?.email && (
                            <a
                              className="feedback-email"
                              href={`mailto:${f.user.email}`}
                            >
                              {f.user.email}
                            </a>
                          )}
                          {f.user?.phone && (
                            <span className="feedback-phone">
                              📞 {f.user.phone}
                            </span>
                          )}
                        </div>
                        <button
                          className="btn-icon-danger"
                          onClick={() => handleDeleteFeedback(f.id)}
                          title="Delete feedback"
                          type="button"
                        >
                          ✕
                        </button>
                      </div>

                      {f.subject && (
                        <div className="feedback-subject">
                          <strong>Subject:</strong> {f.subject}
                        </div>
                      )}

                      <p className="feedback-message">{f.message}</p>

                      <div className="feedback-meta">🕒 {fmt(f.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* LOST USERS */}
          {activeTab === "lost" && (
            <section className="acp-card">
              <div className="acp-card-header">
                <h2>
                  ⚠️ Lost Users
                  <span className="section-sub">
                    no order in last {inactiveDays} days
                  </span>
                </h2>
                <div className="acp-filters">
                  <label>Inactivity:</label>
                  <select
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(Number(e.target.value))}
                  >
                    {[7, 14, 30, 60, 90].map((d) => (
                      <option key={d} value={d}>
                        {d} days
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loadingLost ? (
                <Spinner label="Loading lost users…" />
              ) : lostUsers.length === 0 ? (
                <EmptyState
                  icon="🎉"
                  text="No lost users — everyone is active!"
                />
              ) : (
                <div className="acp-table-wrap">
                  <table className="acp-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Orders</th>
                        <th>Last Order</th>
                        <th>Inactive For</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lostUsers.map((u) => (
                        <tr key={u.id} className="row-danger">
                          <td className="mono">{u.id}</td>
                          <td>
                            <div className="name-cell">
                              <Avatar name={u.name || u.email} />
                              <strong>{u.name || "—"}</strong>
                            </div>
                          </td>
                          <td className="muted">{u.email}</td>
                          <td>
                            <span className="badge red">
                              {u.order_count ?? 0}
                            </span>
                          </td>
                          <td className="muted">
                            {u.last_order_at
                              ? fmt(u.last_order_at)
                              : "Never"}
                          </td>
                          <td>
                            <span className="pill amber">
                              {daysSince(u.last_order_at)}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn-danger"
                              onClick={() => handleDeleteUser(u.id)}
                              type="button"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* CUSTOMER ITEMS */}
          {activeTab === "items" && (
            <section className="acp-card">
              <div className="acp-card-header">
                <h2>
                  🛒 Customer Items
                  <span className="section-sub">items each user bought</span>
                </h2>
                <div className="acp-search-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    className="acp-search"
                    placeholder="Search by name, email, or ID…"
                    value={itemsSearch}
                    onChange={(e) => setItemsSearch(e.target.value)}
                  />
                  {itemsSearch && (
                    <button
                      className="search-clear"
                      onClick={() => setItemsSearch("")}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {loadingItems ? (
                <Spinner label="Loading customer items…" />
              ) : filteredCustomerItems.length === 0 ? (
                <EmptyState icon="🛒" text="No purchases recorded yet." />
              ) : (
                <div className="acp-table-wrap">
                  <table className="acp-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Orders</th>
                        <th>Items</th>
                        <th>Spent</th>
                        <th>Last Order</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomerItems.map((u) => {
                        const isOpen = expandedUser === u.id;
                        const itemsList = Array.isArray(u.items)
                          ? u.items
                          : [];

                        return (
                          <Fragment key={u.id}>
                            <tr>
                              <td className="mono">{u.id}</td>
                              <td>
                                <div className="name-cell">
                                  <Avatar name={u.name || u.email} />
                                  <div className="cust-info">
                                    <strong>{u.name || "Unknown"}</strong>
                                    <span className="muted">{u.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge blue">
                                  {u.orderCount ?? 0}
                                </span>
                              </td>
                              <td>
                                <span className="badge green">
                                  {u.itemsCount ?? 0}
                                </span>
                              </td>
                              <td className="muted">
                                ₹
                                {Number(u.amountSpent || 0).toLocaleString(
                                  "en-IN"
                                )}
                              </td>
                              <td className="muted">
                                {u.lastOrderAt ? fmt(u.lastOrderAt) : "—"}
                              </td>
                              <td>
                                {itemsList.length > 0 ? (
                                  <button
                                    className="btn-ghost"
                                    onClick={() =>
                                      setExpandedUser(isOpen ? null : u.id)
                                    }
                                    type="button"
                                  >
                                    {isOpen
                                      ? "▲ Hide"
                                      : `▼ ${itemsList.length} item${
                                          itemsList.length !== 1 ? "s" : ""
                                        }`}
                                  </button>
                                ) : (
                                  <span className="muted">No purchases</span>
                                )}
                              </td>
                            </tr>

                            {isOpen && itemsList.length > 0 && (
                              <tr className="expand-row">
                                <td colSpan={7}>
                                  <div className="items-panel">
                                    <h4>Purchased Items</h4>
                                    <div className="items-grid">
                                      {itemsList.map((it, idx) => (
                                        <div className="item-chip" key={idx}>
                                          <span className="item-name">
                                            {it.name}
                                          </span>
                                          <span className="item-meta">
                                            ×{it.qty} · ₹{it.price} each
                                          </span>
                                          <span className="item-total">
                                            ₹
                                            {Number(
                                              it.totalSpent || 0
                                            ).toLocaleString("en-IN")}
                                          </span>
                                        </div>
                                      ))}
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
            </section>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Small components ─── */
function StatCard({ label, value, variant, icon }) {
  return (
    <div className={`acp-stat ${variant}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}

function Spinner({ label }) {
  return (
    <div className="acp-spinner-wrap">
      <div className="acp-spinner" />
      <p>{label}</p>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="acp-empty">
      <div className="empty-icon">{icon}</div>
      <p>{text}</p>
    </div>
  );
}

function Avatar({ name }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const hues = [210, 160, 30, 350, 270, 190, 20, 120];
  const code = (name || "?")
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hues[code % hues.length];

  return (
    <div
      className="acp-avatar"
      style={{
        background: `hsl(${hue}, 70%, 92%)`,
        color: `hsl(${hue}, 60%, 35%)`,
      }}
    >
      {initial}
    </div>
  );
}
