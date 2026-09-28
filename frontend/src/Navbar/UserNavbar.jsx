// src/Navbar/UserNavbar.jsx
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../Css/UserNavbar.css";

const NAV_LINKS = [
  { to: "/",        label: "Home",         icon: "🏠" },
  { to: "/product", label: "Products",     icon: "🛍️" },
  { to: "/track",   label: "Track Order",  icon: "📍" },
  { to: "/contact", label: "Contact",      icon: "📞" },
  { to: "/about",   label: "About",        icon: "ℹ️" },
];

const UserNavbar = () => {
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  /* Cart count */
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();
    window.addEventListener("cart-updated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cart-updated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  /* Close menu on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Lock body scroll when menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  /* ⭐ Open cart — works from any page */
  const openCart = () => {
    setMenuOpen(false);

    // If already on products page → just open the drawer
    if (pathname.startsWith("/cart")) {
      window.dispatchEvent(new Event("open-cart"));
      return;
    }

    // Otherwise go to products, then open cart
    navigate("/cart");
    // Small delay so Product page mounts and can listen
    setTimeout(() => {
      window.dispatchEvent(new Event("open-cart"));
    }, 150);
  };

  const isActive = (path) => {
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="user-mobile-bar">
        <Link to="/" className="user-mobile-brand" onClick={() => setMenuOpen(false)}>
          <img src="/images.jpg" alt="Gokul Namkeen" className="logo" />
          <span className="gokul">Gokul Namkeen</span>
        </Link>

        <div className="user-mobile-actions">
          {/* ⭐ Cart button (mobile) */}
          <button
            type="button"
            className="cart-btn mobile"
            onClick={openCart}
            aria-label="Open cart"
          >
            🛒
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          <button
            className={`menu-toggle ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="nav-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav className={`user-navbar ${menuOpen ? "mobile-open" : ""}`}>
        <div className="nav-wrapper">
          {/* Brand */}
          <Link to="/" className="nav-brand" onClick={() => setMenuOpen(false)}>
            <img src="/images.jpg" alt="Gokul Namkeen" className="logo" />
            <div className="brand-text">
              <span className="brand-name">Gokul Namkeen</span>
              <span className="brand-tagline">Authentic since 2004</span>
            </div>
          </Link>

          {/* Links */}
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

          {/* Right side: Cart + User + Logout */}
          <div className="nav-actions">
            {/* ⭐ Cart button (desktop) */}
            <button
              type="button"
              className="cart-btn desktop"
              onClick={openCart}
              aria-label="View cart"
            >
              <span className="cart-icon">🛒</span>
              <span className="cart-text">Cart</span>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            {user ? (
              <div className="user-chip">
                <div className="user-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="user-meta">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">Customer</span>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="login-link"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}

            {user && (
              <button
                className="logout-btn"
                onClick={handleLogout}
                type="button"
              >
                <span className="logout-icon">⎋</span>
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default UserNavbar;