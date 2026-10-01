// src/pages/Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Css/Home.css";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import UserNavbar from "../Navbar/UserNavbar";
import { useAuth } from "./AuthContext";
import Loading from "./Loading";
import { getImageUrl } from "../utils/image";
import useScrollReveal from "../hooks/useScrollReveal";

/* ─── Static content ─── */
const FEATURES = [
  { icon: "🍔", title: "Authentic Taste", desc: "Made with traditional recipes passed down for generations." },
  { icon: "✨", title: "Premium Quality", desc: "Only the finest ingredients sourced from trusted suppliers." },
  { icon: "🚚", title: "Fast Delivery", desc: "Quick and reliable shipping straight to your doorstep." },
  { icon: "💚", title: "Healthy Choice", desc: "No artificial flavors or harmful preservatives." },
];

const STATS = [
  { value: "20+",  count: 20,    suffix: "+",  label: "Years of Excellence" },
  { value: "50K+", count: 50000, suffix: "K+", label: "Happy Customers" },
  { value: "100+", count: 100,   suffix: "+",  label: "Authentic Recipes" },
  { value: "4.9★", count: 4,     suffix: ".9★", label: "Average Rating" },
];

const MARQUEE_ITEMS = [
  "Handcrafted Daily",
  "No Preservatives",
  "Made in Surat",
  "Free Shipping ₹499+",
  "Family Owned Since 2004",
  "100% Authentic Recipes",
];

const TESTIMONIALS = [
  { name: "Priya Sharma", role: "Regular Customer", city: "Ahmedabad", initial: "P", color: "#f59e0b",
    text: "Amazing taste! Just like my grandmother used to make. The quality is unmatched and delivery is always on time." },
  { name: "Rajesh Patel", role: "Verified Buyer", city: "Surat", initial: "R", color: "#16a34a",
    text: "Best quality snacks I've ever had. Fresh packaging and always on time delivery. My family loves the sev." },
  { name: "Neha Gupta", role: "Loyal Customer", city: "Mumbai", initial: "N", color: "#3b82f6",
    text: "Fast delivery and amazing taste. My family orders every month. Highly recommended for anyone who loves authentic namkeen!" },
];

/* NEW SECTIONS DATA */
const PROCESS_STEPS = [
  { step: "01", icon: "🌾", title: "Sourced Fresh", desc: "We hand-pick premium ingredients from local farms and trusted suppliers across Gujarat." },
  { step: "02", icon: "👨‍🍳", title: "Handcrafted", desc: "Our master chefs use age-old recipes passed down through 3 generations." },
  { step: "03", icon: "📦", title: "Sealed Fresh", desc: "Every pack is vacuum-sealed within hours to lock in the crunch and aroma." },
  { step: "04", icon: "🚚", title: "Delivered Fast", desc: "Dispatched same-day and delivered to your doorstep in 2–4 days." },
];

const TRUST_BADGES = [
  { icon: "🏆", title: "FSSAI Certified", sub: "Lic. No. 10023456789" },
  { icon: "🌱", title: "100% Vegetarian", sub: "Pure veg facility" },
  { icon: "🔒", title: "Secure Payments", sub: "SSL encrypted" },
  { icon: "↩️", title: "Easy Returns", sub: "7-day policy" },
];

const FAQS = [
  { q: "How long does delivery take?", a: "Orders are dispatched same-day and typically delivered within 2–4 business days across India. Metro cities often receive within 48 hours." },
  { q: "Are your products preservative-free?", a: "Yes! We use zero artificial preservatives, colors, or flavors. Our vacuum-sealed packaging keeps everything fresh naturally." },
  { q: "Do you offer bulk / wholesale orders?", a: "Absolutely. For orders above 5kg or corporate gifting, email us at support@gokulnamkeen.com and we'll send a custom quote." },
  { q: "What payment methods do you accept?", a: "We accept UPI, credit/debit cards, net banking, and Cash on Delivery for orders below ₹5,000." },
  { q: "Can I return a product?", a: "Yes — if the seal is intact and you notify us within 7 days of delivery, we'll issue a full refund or replacement." },
];

const AWARDS = [
  { year: "2024", title: "Best Regional Snack Brand", org: "Gujarat Food Awards" },
  { year: "2023", title: "Top Rated by 10K+ Families", org: "Trustpilot India" },
  { year: "2022", title: "Excellence in Traditional Foods", org: "FICCI Gujarat" },
  { year: "2021", title: "Fastest Growing FMCG Brand", org: "Business Today" },
];

const INSTAGRAM_POSTS = [
  { emoji: "🥨", likes: "2.4K", tag: "#Namkeen" },
  { emoji: "🍿", likes: "1.8K", tag: "#Fresh" },
  { emoji: "🌶️", likes: "3.1K", tag: "#Spicy" },
  { emoji: "🧡", likes: "1.5K", tag: "#Snacks" },
  { emoji: "✨", likes: "2.9K", tag: "#Handmade" },
  { emoji: "🎁", likes: "1.2K", tag: "#Gifting" },
];

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  /* ─── Slide-reveal observer ─── */
  useScrollReveal(products.length);

  /* ─── Fetch products (limit 4) ─── */
  useEffect(() => {
    setProductsLoading(true);
    api
      .get("/products?limit=4")
      .then(({ data }) => setProducts(Array.isArray(data) ? data : []))
      .catch((err) =>
        console.error("products fetch:", err.response?.status, err.message)
      )
      .finally(() => setProductsLoading(false));
  }, []);

  /* ─── Fetch company info ─── */
  useEffect(() => {
    api
      .get("/company-info")
      .then(({ data }) => setCompany(data))
      .catch((err) =>
        console.error("company info fetch:", err.response?.status, err.message)
      );
  }, []);

  if (loading) return <Loading />;

  const goToProducts = () => navigate("/product");
  const goToProduct = (id) => navigate(`/product/${id}`);
  const formatPrice = (n) => Number(n || 0).toLocaleString("en-IN");

  const companyName = company?.name || "Gokul Namkeen";
  const companyFounder = company?.founder || "";
  const companyTagline = company?.tagline || "Authentic since 2004";
  const companyDescription = company?.description || "";

  const primaryPhone = company?.phones?.[0] || "";
  const primaryEmail = company?.emails?.[0] || "";
  const address = company?.address_street
    ? [company.address_street, company.address_city, company.address_state]
        .filter(Boolean)
        .join(", ")
    : "";

  const CONTACT_CARDS = [
    {
      icon: "📍",
      title: "Visit Us",
      lines: company
        ? [
            company.address_street || "—",
            [company.address_city, company.address_state].filter(Boolean).join(", "),
          ].filter(Boolean)
        : ["Mota Varachha", "Surat, Gujarat 395001"],
      action: {
        label: "Get Directions →",
        href: `https://maps.google.com/?q=${encodeURIComponent(address || "Mota Varachha Surat")}`,
      },
    },
    {
      icon: "📞",
      title: "Call Us",
      lines: company?.phones?.length ? company.phones : ["—"],
      links: company?.phones?.map((p) => `tel:${p.replace(/\s+/g, "")}`) || [],
      action: primaryPhone
        ? { label: "Call Now →", href: `tel:${primaryPhone.replace(/\s+/g, "")}` }
        : { label: "Call Now →", href: "#" },
    },
    {
      icon: "📧",
      title: "Email Us",
      lines: company?.emails?.length ? company.emails : ["—"],
      links: company?.emails?.map((e) => `mailto:${e}`) || [],
      action: primaryEmail
        ? { label: "Send Email →", href: `mailto:${primaryEmail}` }
        : { label: "Send Email →", href: "#" },
    },
  ];

  return (
    <>
      {user?.is_admin ? <AdminNavbar /> : <UserNavbar />}

      <main className='home-container'>
        {/* ─── ANNOUNCEMENT BAR ─── */}
        <div className="gn-announce">
          <span>🎉 Free shipping on orders above ₹499</span>
          <span className="gn-announce-sep">•</span>
          <span>New customers get 10% off with code <strong>WELCOME10</strong></span>
        </div>

        {/* ─── HERO ─── */}
        <section id='home' className='hero'>
          <div className='hero-bg' aria-hidden='true' />

          <div className='gn-particles' aria-hidden='true'>
            <span /><span /><span /><span /><span /><span />
          </div>

          <div className='hero-inner'>
            <div className='hero-content'>
              <span className='hero-eyebrow'>
                <span className='hero-eyebrow-dot' /> {companyTagline}
              </span>
              <h1 className='hero-title'>
                <span className='gn-word'>Welcome</span>{" "}
                <span className='gn-word'>to</span>{" "}
                <span className='gn-word brand-highlight'>{companyName}</span>
              </h1>
              <p className='hero-subtitle'>
                {companyDescription ||
                  "Taste the tradition. Enjoy the pure, authentic flavor of handcrafted namkeen made with love and the finest ingredients."}
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
                <span>•</span>
                <span>FSSAI Certified</span>
              </div>
            </div>

            <div className='hero-image-wrap'>
              <div className='hero-image'>
                <img src='/images.jpg' alt={`${companyName} assortment`} loading='eager' />
              </div>
              <div className='hero-badge'>
                <span className='hero-badge-value'>20+</span>
                <span className='hero-badge-label'>Years of Trust</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── MARQUEE ─── */}
        <div className='gn-marquee' aria-hidden='true'>
          <div className='gn-marquee-track'>
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
        </div>

        {/* ─── TRUST BADGES ─── */}
        <section className='gn-trust-strip'>
          <div className='gn-trust-grid gn-stagger'>
            {TRUST_BADGES.map((b) => (
              <div className='gn-trust-card' key={b.title}>
                <span className='gn-trust-icon' aria-hidden='true'>{b.icon}</span>
                <div>
                  <strong>{b.title}</strong>
                  <span>{b.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── WELCOME ─── */}
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
        <section className='stats gn-reveal'>
          <div className='stats-grid'>
            {STATS.map((s) => (
              <div className='stat-item' key={s.label}>
                <span
                  className='stat-value'
                  data-count={s.count}
                  data-suffix={s.suffix}>
                  {s.value}
                </span>
                <span className='stat-label'>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section className='features'>
          <header className='section-head gn-reveal'>
            <span className='section-tag'>Why Us</span>
            <h2>
              Why <span className='title-highlight'>Choose Us?</span>
            </h2>
            <p className='section-sub'>
              Four reasons families across Gujarat trust {companyName} every day.
            </p>
          </header>
          <div className='features-grid gn-stagger'>
            {FEATURES.map((f) => (
              <article className='feature-card' key={f.title}>
                <div className='feature-icon' aria-hidden='true'>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className='gn-process'>
          <header className='section-head section-head-center gn-reveal'>
            <span className='section-tag'>Our Process</span>
            <h2>
              From Farm to <span className='title-highlight'>Your Doorstep</span>
            </h2>
            <p className='section-sub'>
              Every pack goes through four careful steps before it reaches you.
            </p>
          </header>
          <div className='gn-process-grid gn-stagger'>
            {PROCESS_STEPS.map((s) => (
              <div className='gn-process-card' key={s.step}>
                <span className='gn-process-step'>{s.step}</span>
                <span className='gn-process-icon' aria-hidden='true'>{s.icon}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── PRODUCTS ─── */}
        <section id='products' className='products'>
          <header className='section-head gn-reveal'>
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
              <button className='btn btn-ghost' onClick={goToProducts} type='button'>
                View all →
              </button>
            )}
          </header>

          {productsLoading ? (
            <div className='products-loading'>
              <div className='products-spinner' />
              <p>Loading delicious products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className='products-empty'>
              <span className='empty-emoji'>🥨</span>
              <h3>No products yet</h3>
              <p>Check back soon for our latest offerings.</p>
              <button className='btn btn-primary' onClick={goToProducts} type='button'>
                Browse All Products
              </button>
            </div>
          ) : (
            <>
              <div className='products-grid gn-stagger'>
                {products.slice(0, 4).map((p) => {
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
                          {p.image ? (
                            <img
                              src={
                                typeof getImageUrl === "function"
                                  ? getImageUrl(p.image)
                                  : p.image
                              }
                              alt={p.name}
                              loading='lazy'
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <span className='product-fallback'>🌾</span>
                          )}

                          {outOfStock && (
                            <span className='product-badge out'>Out of Stock</span>
                          )}
                          {!outOfStock && p.stock > 0 && p.stock < 10 && (
                            <span className='product-badge low'>Only {p.stock} left</span>
                          )}
                        </div>

                        <div className='product-body'>
                          {p.category && (
                            <span className='product-category'>{p.category}</span>
                          )}
                          <h3 className='product-title'>{p.name}</h3>
                          <div className='product-meta'>
                            <span className='product-price'>₹{formatPrice(p.price)}</span>
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

              {products.length > 4 && (
                <div className='products-more'>
                  <button className='btn btn-ghost' onClick={goToProducts} type='button'>
                    View all products →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className='testimonials'>
          <header className='section-head section-head-center gn-reveal'>
            <span className='section-tag'>Reviews</span>
            <h2>
              What Our Customers <span className='title-highlight'>Say</span>
            </h2>
            <p className='section-sub'>
              Real stories from families who love {companyName}.
            </p>
          </header>
          <div className='testimonials-grid gn-stagger'>
            {TESTIMONIALS.map((t) => (
              <blockquote className='testimonial-card' key={t.name}>
                <div className='stars' aria-label='5 out of 5 stars'>★★★★★</div>
                <p>"{t.text}"</p>
                <footer>
                  <div className='gn-avatar-row'>
                    <span
                      className='gn-avatar'
                      style={{ background: t.color }}>
                      {t.initial}
                    </span>
                    <div>
                      <cite>— {t.name}</cite>
                      {t.role && (
                        <span className='testimonial-role'>
                          {t.role} · {t.city}
                        </span>
                      )}
                    </div>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        {/* ─── AWARDS ─── */}
        <section className='gn-awards'>
          <header className='section-head section-head-center gn-reveal'>
            <span className='section-tag'>Recognition</span>
            <h2>
              Awards & <span className='title-highlight'>Milestones</span>
            </h2>
          </header>
          <div className='gn-awards-grid gn-stagger'>
            {AWARDS.map((a) => (
              <div className='gn-award-card' key={a.title}>
                <span className='gn-award-year'>{a.year}</span>
                <h3>{a.title}</h3>
                <p>{a.org}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ABOUT ─── */}
        <section id='about' className='about'>
          <header className='section-head gn-reveal'>
            <span className='section-tag'>Our Story</span>
            <h2>
              About <span className='title-highlight'>{companyName}</span>
            </h2>
          </header>
          <div className='about-content'>
            <div className='about-text gn-reveal from-left'>
              <p className='about-lead'>
                {companyDescription ||
                  `With over 20 years of experience, ${companyName} has been serving authentic traditional snacks and sweets to families across the region.`}
              </p>
              <p>
                Our commitment to quality, taste, and tradition has made us a
                trusted name in every household. We use only the finest
                ingredients and follow time-tested recipes that have been
                passed down through generations.
                {companyFounder && (
                  <>
                    {" "}Founded and led by <strong>{companyFounder}</strong>.
                  </>
                )}
              </p>
              <ul className='about-list'>
                <li><span className='about-check'>✓</span> 20+ Years of Experience</li>
                <li><span className='about-check'>✓</span> 100% Authentic Recipes</li>
                <li><span className='about-check'>✓</span> Premium Quality Ingredients</li>
                <li><span className='about-check'>✓</span> Trusted by Thousands of Families</li>
              </ul>
              <button className='btn btn-primary' onClick={goToProducts}>
                Explore Our Range
              </button>
            </div>
            <div className='about-image gn-reveal from-right'>
              <img src='/images.jpg' alt={`About ${companyName}`} loading='lazy' />
              <div className='about-image-overlay'><span>Est. 2004</span></div>
            </div>
          </div>
        </section>

        {/* ─── INSTAGRAM GALLERY ─── */}
        <section className='gn-insta'>
          <header className='section-head section-head-center gn-reveal'>
            <span className='section-tag'>📸 @gokulnamkeen</span>
            <h2>
              Follow Us on <span className='title-highlight'>Instagram</span>
            </h2>
            <p className='section-sub'>
              Tag us in your snacking moments for a chance to be featured.
            </p>
          </header>
          <div className='gn-insta-grid gn-stagger'>
            {INSTAGRAM_POSTS.map((p, i) => (
              <div className='gn-insta-card' key={i}>
                <span className='gn-insta-emoji'>{p.emoji}</span>
                <div className='gn-insta-overlay'>
                  <span>❤️ {p.likes}</span>
                  <span>{p.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className='gn-faq'>
          <header className='section-head section-head-center gn-reveal'>
            <span className='section-tag'>FAQ</span>
            <h2>
              Frequently Asked <span className='title-highlight'>Questions</span>
            </h2>
            <p className='section-sub'>
              Everything you need to know before you order.
            </p>
          </header>
          <div className='gn-faq-list gn-reveal'>
            {FAQS.map((f, i) => (
              <div
                key={f.q}
                className={`gn-faq-item ${openFaq === i ? "is-open" : ""}`}
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                <div className='gn-faq-q'>
                  <span>{f.q}</span>
                  <span className='gn-faq-toggle'>{openFaq === i ? "−" : "+"}</span>
                </div>
                <div className='gn-faq-a'>
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── NEWSLETTER ─── */}
        <section className='gn-newsletter gn-reveal'>
          <div className='gn-newsletter-inner'>
            <div className='gn-newsletter-text'>
              <span className='section-tag'>Stay in Touch</span>
              <h2>Get 10% Off Your First Order</h2>
              <p>
                Subscribe for exclusive offers, new flavour launches, and recipes
                from our kitchen. No spam — we promise.
              </p>
            </div>
            <form
              className='gn-newsletter-form'
              onSubmit={(e) => e.preventDefault()}>
              <input type='email' placeholder='your@email.com' required />
              <button type='submit' className='btn btn-primary'>
                Subscribe
              </button>
            </form>
          </div>
        </section>

        {/* ─── CONTACT ─── */}
        <section id='contact' className='contact'>
          <header className='section-head section-head-center gn-reveal'>
            <span className='section-tag'>📮 Contact</span>
            <h2>
              Get In <span className='title-highlight'>Touch</span>
            </h2>
            <p className='section-sub'>
              We'd love to hear from you. Reach out anytime!
            </p>
          </header>

          <div className='contact-info gn-stagger'>
            {CONTACT_CARDS.map((c) => (
              <article className='contact-card' key={c.title}>
                <div className='contact-icon' aria-hidden='true'>{c.icon}</div>
                <h3>{c.title}</h3>
                <p>
                  {c.lines.map((line, i) => (
                    <span key={`${c.title}-${i}`}>
                      {c.links?.[i] ? (
                        <a href={c.links[i]} className='contact-link'>{line}</a>
                      ) : (line)}
                      {i < c.lines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
                <a
                  className='contact-action'
                  href={c.action.href}
                  target={c.action.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.action.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                  {c.action.label}
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className='cta gn-reveal'>
          <div className='cta-inner'>
            <h2>
              Ready to Taste the <span className='title-highlight'>Tradition?</span>
            </h2>
            <p>
              Order now and enjoy authentic {companyName} delivered fresh to your
              door. New customers get <strong>10% off</strong> on their first order!
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
              <h4>{companyName}</h4>
              <p>
                Authentic snacks & sweets crafted with tradition, quality, and
                love since 2004.
              </p>
              <div className='footer-contact-mini'>
                {address && <span>📍 {address}</span>}
                {primaryPhone && <span>📞 {primaryPhone}</span>}
                {primaryEmail && <span>📧 {primaryEmail}</span>}
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
                {company?.facebook && (
                  <a href={company.facebook} target='_blank' rel='noopener noreferrer'
                     className='social-link facebook' aria-label='Facebook'>
                    <span>Facebook</span>
                  </a>
                )}
                {company?.instagram && (
                  <a href={company.instagram} target='_blank' rel='noopener noreferrer'
                     className='social-link instagram' aria-label='Instagram'>
                    <span>Instagram</span>
                  </a>
                )}
                {company?.twitter && (
                  <a href={company.twitter} target='_blank' rel='noopener noreferrer'
                     className='social-link x-twitter' aria-label='X'>
                    <span>X</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className='footer-bottom'>
            <p>© {new Date().getFullYear()} {companyName}. All rights reserved.</p>
            <p className='footer-made'>Made with ❤️ in Surat, Gujarat</p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default Home;