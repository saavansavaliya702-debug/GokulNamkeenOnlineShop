// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/Home.css";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import UserNavbar from "../Navbar/UserNavbar";
import { useAuth } from "./AuthContext";
import Loading from "./Loading";
import { getImageUrl } from "../utils/image"; // if you have this helper

/* ─── Static content ─── */
const FEATURES = [
  {
    icon: "🍔",
    title: "Authentic Taste",
    desc: "Made with traditional recipes passed down for generations.",
  },
  {
    icon: "✨",
    title: "Premium Quality",
    desc: "Only the finest ingredients sourced from trusted suppliers.",
  },
  {
    icon: "🚚",
    title: "Fast Delivery",
    desc: "Quick and reliable shipping straight to your doorstep.",
  },
  {
    icon: "💚",
    title: "Healthy Choice",
    desc: "No artificial flavors or harmful preservatives.",
  },
];

const STATS = [
  { value: "20+", label: "Years of Excellence" },
  { value: "50K+", label: "Happy Customers" },
  { value: "100+", label: "Authentic Recipes" },
  { value: "4.9★", label: "Average Rating" },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Regular Customer",
    text: "Amazing taste! Just like my grandmother used to make. The quality is unmatched.",
  },
  {
    name: "Rajesh Patel",
    role: "Surat",
    text: "Best quality snacks I've ever had. Fresh packaging and always on time delivery.",
  },
  {
    name: "Neha Gupta",
    role: "Verified Buyer",
    text: "Fast delivery and amazing taste. My family orders every month. Highly recommended!",
  },
];

const CONTACT_CARDS = [
  {
    icon: "📍",
    title: "Visit Us",
    lines: ["Mota Varachha", "Surat, Gujarat 395001"],
    action: {
      label: "Get Directions →",
      href: "https://maps.google.com/?q=Mota+Varachha+Surat",
    },
  },
  {
    icon: "📞",
    title: "Call Us",
    lines: ["+91 98765 43210", "+91 97731 41783"],
    links: ["tel:+919876543210", "tel:+919773141783"],
    action: { label: "Call Now →", href: "tel:+919876543210" },
  },
  {
    icon: "📧",
    title: "Email Us",
    lines: ["info@gokulnamkeen.com", "saavansavaliya702@gmail.com"],
    links: [
      "mailto:info@gokulnamkeen.com",
      "mailto:saavansavaliya702@gmail.com",
    ],
    action: { label: "Send Email →", href: "mailto:info@gokulnamkeen.com" },
  },
];

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    setProductsLoading(true);
    api
      .get("/products?limit=6")
      .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) =>
        console.error("products fetch:", err.response?.status, err.message),
      )
      .finally(() => setProductsLoading(false));
  }, []);

  if (loading) return <Loading />;

  const goToProducts = () => navigate("/product");
  const goToProduct = (id) => navigate(`/product/${id}`);
  const formatPrice = (n) => Number(n || 0).toLocaleString("en-IN");

  return (
    <>
      {user?.is_admin ?
        <AdminNavbar />
      : <UserNavbar />}

      <main className='home-container'>
        {/* ─── HERO ─── */}
        <section id='home' className='hero'>
          <div className='hero-bg' aria-hidden='true' />
          <div className='hero-inner'>
            <div className='hero-content'>
              <span className='hero-eyebrow'>
                <span className='hero-eyebrow-dot' /> Authentic since 2004
              </span>
              <h1>
                Welcome to{" "}
                <span className='brand-highlight'>Gokul Namkeen</span>
              </h1>
              <p className='hero-subtitle'>
                Taste the tradition. Enjoy the pure, authentic flavor of
                handcrafted namkeen made with love and the finest ingredients.
              </p>
              <div className='hero-actions'>
                <button className='btn btn-primary' onClick={goToProducts}>
                  Shop Now
                </button>
                <a className='btn btn-ghost' href='#about'>
                  Our Story
                </a>
              </div>
              <div className='hero-trust'>
                <span>⭐ 4.9 Rating</span>
                <span>•</span>
                <span>50,000+ Happy Customers</span>
              </div>
            </div>

            <div className='hero-image-wrap'>
              <div className='hero-image'>
                <img
                  src='/images.jpg'
                  alt='Gokul Namkeen assortment'
                  loading='eager'
                />
              </div>
              <div className='hero-badge'>
                <span className='hero-badge-value'>20+</span>
                <span className='hero-badge-label'>Years of Trust</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── WELCOME (logged-in) ─── */}
        {user && (
          <section className='welcome-section'>
            <div className='welcome-card'>
              <div className='welcome-text'>
                <h2>
                  Welcome back, <span className='username'>{user.name}</span>{" "}
                  <span className='wave'>👋</span>
                  {user.is_admin && <span className='admin-tag'>Admin</span>}
                </h2>
                <p>
                  Explore our latest products, exclusive offers, and seasonal
                  specials curated just for you.
                </p>
              </div>
              <button className='btn btn-primary' onClick={goToProducts}>
                Browse Products
              </button>
            </div>
          </section>
        )}

        {/* ─── STATS ─── */}
        <section className='stats'>
          <div className='stats-grid'>
            {STATS.map((s) => (
              <div className='stat-item' key={s.label}>
                <span className='stat-value'>{s.value}</span>
                <span className='stat-label'>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className='features'>
          <header className='section-head'>
            <span className='section-tag'>Why Us</span>
            <h2>
              Why <span className='title-highlight'>Choose Us?</span>
            </h2>
            <p className='section-sub'>
              Four reasons families across Gujarat trust Gokul Namkeen every
              day.
            </p>
          </header>
          <div className='features-grid'>
            {FEATURES.map((f) => (
              <article className='feature-card' key={f.title}>
                <div className='feature-icon' aria-hidden='true'>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── PRODUCTS ─── */}
        {/* ─── PRODUCTS ─── */}
        <section id='products' className='products'>
          <header className='section-head'>
            <div>
              <span className='section-tag'>Bestsellers</span>
              <h2>
                Our <span className='title-highlight'>Products</span>
              </h2>
              <p className='section-sub'>
                Freshly made traditional snacks, ready to enjoy.
              </p>
            </div>
            {products.length > 0 && (
              <button
                className='btn btn-ghost'
                onClick={goToProducts}
                type='button'>
                View all →
              </button>
            )}
          </header>

          {productsLoading ?
            <div className='products-loading'>
              <div className='products-spinner' />
              <p>Loading delicious products...</p>
            </div>
          : products.length === 0 ?
            <div className='products-empty'>
              <span className='empty-emoji'>🥨</span>
              <h3>No products yet</h3>
              <p>Check back soon for our latest offerings.</p>
              <button
                className='btn btn-primary'
                onClick={goToProducts}
                type='button'>
                Browse All Products
              </button>
            </div>
          : <>
              <div className='products-grid product-page-style'>
                {products.slice(0, 8).map((p) => {
                  const outOfStock = p.stock === 0;
                  return (
                    <article
                      key={p.id}
                      className={`product-card ${outOfStock ? "out-of-stock" : ""}`}>
                      <div
                        className='product-clickable'
                        onClick={() => goToProduct(p.id)}
                        role='button'
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            goToProduct(p.id);
                          }
                        }}>
                        <div className='product-image'>
                          {p.image ?
                            <img
                              src={
                                typeof getImageUrl === "function" ?
                                  getImageUrl(p.image)
                                : p.image
                              }
                              alt={p.name}
                              loading='lazy'
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          : <span className='product-fallback'>🌾</span>}

                          {outOfStock && (
                            <span className='product-badge out'>
                              Out of Stock
                            </span>
                          )}
                          {!outOfStock && p.stock > 0 && p.stock < 10 && (
                            <span className='product-badge low'>
                              Only {p.stock} left
                            </span>
                          )}
                        </div>

                        <div className='product-body'>
                          {p.category && (
                            <span className='product-category'>
                              {p.category}
                            </span>
                          )}
                          <h3 className='product-title'>{p.name}</h3>
                          <div className='product-meta'>
                            <span className='product-price'>
                              ₹{formatPrice(p.price)}
                            </span>
                            <div className='product-tags'>
                              {p.weight != null && p.weight !== "" && (
                                <span className='tag weight'>
                                  {p.weight}
                                  {p.weightUnit || "g"}
                                </span>
                              )}
                              {Number(p.pcs) > 0 && (
                                <span className='tag pcs'>📦 {p.pcs} pcs</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='product-card-actions'>
                        <button
                          type='button'
                          className='add-cart-btn'
                          disabled={outOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            goToProduct(p.id);
                          }}>
                          {outOfStock ? "Out of Stock" : "View Details"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              {products.length >= 6 && (
                <div className='products-more'>
                  <button
                    className='btn btn-ghost'
                    onClick={goToProducts}
                    type='button'>
                    View all products →
                  </button>
                </div>
              )}
            </>
          }
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className='testimonials'>
          <header className='section-head section-head-center'>
            <span className='section-tag'>Reviews</span>
            <h2>
              What Our Customers <span className='title-highlight'>Say</span>
            </h2>
            <p className='section-sub'>
              Real stories from families who love Gokul Namkeen.
            </p>
          </header>
          <div className='testimonials-grid'>
            {TESTIMONIALS.map((t) => (
              <blockquote className='testimonial-card' key={t.name}>
                <div className='stars' aria-label='5 out of 5 stars'>
                  ★★★★★
                </div>
                <p>"{t.text}"</p>
                <footer>
                  <cite>— {t.name}</cite>
                  {t.role && <span className='testimonial-role'>{t.role}</span>}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ─── ABOUT ─── */}
        <section id='about' className='about'>
          <header className='section-head'>
            <span className='section-tag'>Our Story</span>
            <h2>
              About Gokul <span className='title-highlight'>Namkeen</span>
            </h2>
          </header>
          <div className='about-content'>
            <div className='about-text'>
              <p className='about-lead'>
                With over 20 years of experience, Gokul Namkeen has been serving
                authentic traditional snacks and sweets to families across the
                region.
              </p>
              <p>
                Our commitment to quality, taste, and tradition has made us a
                trusted name in every household. We use only the finest
                ingredients and follow time-tested recipes that have been passed
                down through generations.
              </p>
              <ul className='about-list'>
                <li>
                  <span className='about-check'>✓</span> 20+ Years of Experience
                </li>
                <li>
                  <span className='about-check'>✓</span> 100% Authentic Recipes
                </li>
                <li>
                  <span className='about-check'>✓</span> Premium Quality
                  Ingredients
                </li>
                <li>
                  <span className='about-check'>✓</span> Trusted by Thousands of
                  Families
                </li>
              </ul>
              <button className='btn btn-primary' onClick={goToProducts}>
                Explore Our Range
              </button>
            </div>
            <div className='about-image'>
              <img src='/images.jpg' alt='About Gokul Namkeen' loading='lazy' />
              <div className='about-image-overlay'>
                <span>Est. 2004</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTACT ─── */}
        <section id='contact' className='contact'>
          <header className='section-head section-head-center'>
            <span className='section-tag'>📮 Contact</span>
            <h2>
              Get In <span className='title-highlight'>Touch</span>
            </h2>
            <p className='section-sub'>
              We’d love to hear from you. Reach out anytime!
            </p>
          </header>

          <div className='contact-info'>
            {CONTACT_CARDS.map((c) => (
              <article className='contact-card' key={c.title}>
                <div className='contact-icon' aria-hidden='true'>
                  {c.icon}
                </div>
                <h3>{c.title}</h3>
                <p>
                  {c.lines.map((line, i) => (
                    <span key={line}>
                      {c.links?.[i] ?
                        <a href={c.links[i]} className='contact-link'>
                          {line}
                        </a>
                      : line}
                      {i < c.lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
                <a
                  className='contact-action'
                  href={c.action.href}
                  target={
                    c.action.href.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    c.action.href.startsWith("http") ?
                      "noopener noreferrer"
                    : undefined
                  }>
                  {c.action.label}
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className='cta'>
          <div className='cta-inner'>
            <h2>
              Ready to Taste the{" "}
              <span className='title-highlight'>Tradition?</span>
            </h2>
            <p>
              Order now and enjoy authentic Gokul Namkeen delivered fresh to
              your door. New customers get <strong>10% off</strong> on their
              first order!
            </p>
            <button className='btn btn-primary btn-lg' onClick={goToProducts}>
              Order Now
            </button>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className='footer'>
          <div className='footer-content'>
            <div className='footer-brand'>
              <h4>Gokul Namkeen</h4>
              <p>
                Authentic snacks & sweets crafted with tradition, quality, and
                love since 2004.
              </p>
              <div className='footer-contact-mini'>
                <span>📍 Mota Varachha, Surat</span>
                <span>📞 +91 98765 43210</span>
              </div>
            </div>

            <div className='footer-section'>
              <h4>Quick Links</h4>
              <ul className='quick-links'>
                {[
                  { href: "/home", icon: "🏠", label: "Home" },
                  { href: "/product", icon: "🛒", label: "Products" },
                  { href: "#about", icon: "ℹ️", label: "About" },
                  { href: "#contact", icon: "📞", label: "Contact" },
                ].map((l) => (
                  <li key={l.href}>
                    <a href={l.href}>
                      <span className='link-icon'>{l.icon}</span>
                      <span className='link-text'>{l.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className='footer-section'>
              <h4>Follow Us</h4>
              <div className='social-links'>
                <a
                  href='https://www.facebook.com/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='social-link facebook'
                  aria-label='Facebook'>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='currentColor'>
                    <path d='M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z' />
                  </svg>
                  <span>Facebook</span>
                </a>
                <a
                  href='https://www.instagram.com/?hl=en'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='social-link instagram'
                  aria-label='Instagram'>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='currentColor'>
                    <path d='M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Z' />
                  </svg>
                  <span>Instagram</span>
                </a>
                <a
                  href='https://x.com/'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='social-link x-twitter'
                  aria-label='X'>
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='currentColor'>
                    <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z' />
                  </svg>
                  <span>X</span>
                </a>
              </div>
            </div>
          </div>

          <div className='footer-bottom'>
            <p>
              © {new Date().getFullYear()} Gokul Namkeen. All rights reserved.
            </p>
            <p className='footer-made'>Made with ❤️ in Surat, Gujarat</p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Home;
