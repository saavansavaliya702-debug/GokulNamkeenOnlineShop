// src/Navbar/AdminNavbar.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/AuthContext";
import "../Css/AdminNavbar.css";

const NAV_LINKS = [
  { to: "/dashboard",  label: "Dashboard",    icon: "📊" },
  { to: "/addproduct", label: "Add Products", icon: "➕" },
  { to: "/record",     label: "Records",      icon: "📋" },
  { to: "/order",      label: "Orders",       icon: "📦" },
  { to: "/customer",   label: "Customers",    icon: "👥" },
];

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* Auto-close mobile menu on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const isActive = (path) =>
    pathname === path || pathname.startsWith(path + "/");

  return (
    <>
      {/* Mobile top bar */}
      <div className="admin-mobile-bar">
        <div className="admin-mobile-brand">
          <img src="/images.jpg" alt="Gokul Namkeen" className="logo" />
          <span>Gokul Admin</span>
        </div>
        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="menu-toggle-icon">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="nav-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav className={`admin-navbar ${menuOpen ? "mobile-open" : ""}`}>
        <div className="nav-wrapper">
          {/* Brand */}
          <Link to="/dashboard" className="nav-brand" onClick={() => setMenuOpen(false)}>
            <img src="/images.jpg" alt="Gokul Namkeen" className="logo" />
            <div className="brand-text">
              <span className="brand-name">Gokul Namkeen</span>
              <span className="brand-role">Admin Panel</span>
            </div>
          </Link>

          {/* Navigation links */}
          <ul className="nav-menu">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`nav-link ${isActive(to) ? "active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {icon}
                  </span>
                  <span className="nav-label">{label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* User + Logout */}
          <div className="nav-user-area">
            {user && (
              <div className="user-chip">
                <div className="user-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="user-meta">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">Administrator</span>
                </div>
              </div>
            )}

            <button className="logout-btn" onClick={handleLogout} type="button">
              <span className="logout-icon">⎋</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default AdminNavbar;