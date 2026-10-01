// src/pages/Contact.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import UserNavbar from "../Navbar/UserNavbar";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import useScrollReveal from "../hooks/useScrollReveal";
import "../Css/contact.css";

const MFG_CARDS = [
  { icon: "🏭", title: "4 Manufacturing Units", desc: "State-of-the-art facilities with modern machinery and strict quality control." },
  { icon: "👷", title: "850+ Employees", desc: "Skilled workforce dedicated to maintaining traditional taste with modern hygiene." },
  { icon: "📦", title: "Daily Production", desc: "Over 45 tonnes of authentic namkeen and snacks produced every day." },
  { icon: "🌍", title: "Export Ready", desc: "Dedicated export facility near Mundra Port for seamless international shipping." },
];

// ── NEW: Support channels ──
const SUPPORT_CHANNELS = [
  {
    icon: "💬",
    title: "Live Chat",
    detail: "Mon–Sat, 9 AM – 7 PM IST",
    action: "Avg. response: 2 minutes",
  },
  {
    icon: "📧",
    title: "Email Support",
    detail: "support@gokulnamkeen.com",
    action: "Reply within 24 hours",
  },
  {
    icon: "📞",
    title: "Phone Support",
    detail: "+91 98765 43210",
    action: "Mon–Sat, 9 AM – 7 PM IST",
  },
  {
    icon: "🤝",
    title: "Bulk / Wholesale",
    detail: "wholesale@gokulnamkeen.com",
    action: "Dedicated B2B desk",
  },
];

// ── NEW: FAQ ──
const FAQS = [
  {
    q: "Do you ship internationally?",
    a: "Yes. We currently export to 18+ countries including USA, Canada, UK, UAE, Saudi Arabia, Singapore and Australia. Contact our export desk for bulk orders.",
  },
  {
    q: "What is the minimum order for wholesale?",
    a: "For domestic wholesale, the minimum order is 50 kg. For international bulk orders, please reach out to our B2B team for a customized quote.",
  },
  {
    q: "How long does delivery take?",
    a: "Domestic orders are typically delivered within 3–7 business days. International shipping usually takes 10–21 days depending on the destination.",
  },
  {
    q: "Are your products FSSAI certified?",
    a: "Absolutely. All our products are FSSAI certified and manufactured in ISO 22000 and HACCP compliant facilities.",
  },
  {
    q: "Can I visit your manufacturing facility?",
    a: "We welcome scheduled visits for business partners and distributors. Please contact us at least 7 days in advance to arrange a tour.",
  },
];

// ── NEW: Office locations ──
const OFFICES = [
  {
    city: "Surat (Head Office)",
    address: "Mota Varachha, Surat, Gujarat 394101",
    phone: "+91 98765 43210",
    hours: "Mon–Sat · 9 AM – 7 PM",
  },
  {
    city: "Mumbai (Regional Office)",
    address: "Andheri East, Mumbai, Maharashtra 400069",
    phone: "+91 98765 43211",
    hours: "Mon–Sat · 10 AM – 6 PM",
  },
  {
    city: "Delhi (North India Hub)",
    address: "Okhla Industrial Area, New Delhi 110020",
    phone: "+91 98765 43212",
    hours: "Mon–Sat · 10 AM – 6 PM",
  },
];

const Contact = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const formBoxRef = useRef(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // ── NEW: FAQ open state ──
  const [openFaq, setOpenFaq] = useState(0);

  const SUBMIT_COOLDOWN = 3000;

  /* Scroll reveal */
  useScrollReveal(company ? 1 : 0);

  useEffect(() => {
    let mounted = true;
    api
      .get("/company-info")
      .then(({ data }) => mounted && setCompany(data))
      .catch(() => mounted && setCompany(null))
      .finally(() => mounted && setLoadingCompany(false));
    return () => {
      mounted = false;
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (phone.trim() && !/^[0-9\s\-+()]{10,}$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCTAClick = () => {
    formBoxRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors above");
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_COOLDOWN) {
      toast.error("Please wait a moment before sending another message");
      return;
    }

    setLoading(true);
    setLastSubmitTime(now);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    };

    try {
      await api.post("/contact", payload);

      setSuccess(true);
      setErrors({});
      toast.success("Message sent successfully!");

      setTimeout(() => {
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
        setSuccess(false);
      }, 3500);
    } catch (err) {
      let msg = "Failed to send message. Please try again.";
      if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.response?.status === 429)
        msg = "Too many requests. Please wait a moment.";
      else if (err.response?.status === 400)
        msg = "Invalid form data. Please check and try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {user?.is_admin ? <AdminNavbar /> : <UserNavbar />}
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="contact-page">
        {/* Floating particles */}
        <div className="ct-particles" aria-hidden="true">
          <span /><span /><span /><span /><span /><span />
        </div>

        {/* ── Hero ── */}
        <section className="contact-hero">
          <div className="ct-hero-bg" aria-hidden="true" />
          <div className="contact-hero-inner">
            <BackButton
              className="contact-back"
              onClick={() => navigate(-1)}
            />
            <span className="contact-eyebrow">
              <span className="ct-eyebrow-dot" />
              Get in Touch
            </span>
            <h1 className="ct-title">
              Contact <span className="highlight">Us</span>
            </h1>
            <p>
              We would love to hear from you. Reach out for business inquiries,
              partnerships, or any questions about our products.
            </p>

            <div className="ct-hero-actions">
              <a className="btn ct-btn-primary" href="#contact-form">
                Send a Message
              </a>
              <a className="btn ct-btn-ghost" href="tel:+91">
                📞 Call Us
              </a>
            </div>

            <div className="ct-quick">
              <div className="ct-quick-item">
                <span className="ct-quick-icon">⚡</span>
                <div>
                  <strong>Fast Response</strong>
                  <span>Within 24 hours</span>
                </div>
              </div>
              <div className="ct-quick-item">
                <span className="ct-quick-icon">🏢</span>
                <div>
                  <strong>4 Units</strong>
                  <span>Across Gujarat</span>
                </div>
              </div>
              <div className="ct-quick-item">
                <span className="ct-quick-icon">🌍</span>
                <div>
                  <strong>Export Ready</strong>
                  <span>Worldwide shipping</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEW: Support channels ── */}
        <section className="contact-support">
          <div className="contact-container">
            <header className="section-head gn-reveal">
              <span className="section-tag">Support</span>
              <h2>
                How Can We <span className="highlight">Help You?</span>
              </h2>
              <p className="section-sub">
                Choose the channel that works best for you — we're here to
                answer every question.
              </p>
            </header>

            <div className="support-grid gn-stagger">
              {SUPPORT_CHANNELS.map((s) => (
                <article key={s.title} className="support-card">
                  <div className="support-icon">{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p className="support-detail">{s.detail}</p>
                  <span className="support-action">{s.action}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Main grid ── */}
        <section className="contact-main">
          <div className="contact-container">
            <div className="contact-grid">
              {/* Company info */}
              <div className="contact-info gn-reveal from-left">
                <h2>
                  <span className="ct-section-icon">🏢</span> Company Details
                </h2>

                {loadingCompany ? (
                  <p className="info-loading">Loading company details…</p>
                ) : !company ? (
                  <p className="info-loading">
                    Company details are not available.
                  </p>
                ) : (
                  <div className="info-list gn-stagger">
                    <div className="info-item">
                      <span className="info-icon">🏢</span>
                      <div>
                        <h4>Company Name</h4>
                        <p>{company.name}</p>
                      </div>
                    </div>

                    {company.founder && (
                      <div className="info-item">
                        <span className="info-icon">👤</span>
                        <div>
                          <h4>Founder & Owner</h4>
                          <p>{company.founder}</p>
                        </div>
                      </div>
                    )}

                    {company.units?.length > 0 && (
                      <div className="info-item">
                        <span className="info-icon">🏭</span>
                        <div>
                          <h4>Manufacturing Units</h4>
                          <p>
                            {company.units.map((unit, idx) => (
                              <span key={idx}>
                                • {unit}
                                {idx < company.units.length - 1 && <br />}
                              </span>
                            ))}
                          </p>
                        </div>
                      </div>
                    )}

                    {(company.address_street ||
                      company.address_city ||
                      company.address_state) && (
                      <div className="info-item">
                        <span className="info-icon">📍</span>
                        <div>
                          <h4>Registered Address</h4>
                          <p>
                            {company.address_street}
                            {company.address_street && <br />}
                            {company.address_city}
                            {company.address_city && <br />}
                            {company.address_state}
                          </p>
                        </div>
                      </div>
                    )}

                    {company.phones?.length > 0 && (
                      <div className="info-item">
                        <span className="info-icon">📞</span>
                        <div>
                          <h4>Phone</h4>
                          <p>
                            {company.phones.map((p, i) => (
                              <a
                                key={i}
                                href={`tel:${p.replace(/\s+/g, "")}`}
                                className="ct-link"
                              >
                                {p}
                                {i < company.phones.length - 1 ? " | " : ""}
                              </a>
                            ))}
                          </p>
                        </div>
                      </div>
                    )}

                    {company.emails?.length > 0 && (
                      <div className="info-item">
                        <span className="info-icon">✉️</span>
                        <div>
                          <h4>Email</h4>
                          {company.emails.map((mail, idx) => (
                            <p key={idx}>
                              <a href={`mailto:${mail}`} className="ct-link">
                                {mail}
                              </a>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {company.website && (
                      <div className="info-item">
                        <span className="info-icon">🌐</span>
                        <div>
                          <h4>Website</h4>
                          <p>
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ct-link"
                            >
                              {company.website}
                            </a>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Map placeholder */}
                <div className="ct-map">
                  <div className="ct-map-pin">📍</div>
                  <div className="ct-map-text">
                    <strong>Head Office</strong>
                    <span>Mota Varachha, Surat, Gujarat</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div
                className="contact-form-wrap gn-reveal from-right"
                ref={formBoxRef}
                id="contact-form"
              >
                <h2>
                  <span className="ct-section-icon">✉️</span> Send us a Message
                </h2>
                <p className="ct-form-lead">
                  Fill in the form below and we'll get back to you within 24
                  hours.
                </p>

                {success && (
                  <div className="success-banner" role="alert">
                    ✓ Message sent successfully! We'll get back to you soon.
                  </div>
                )}

                <form
                  className="contact-form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="form-group">
                    <label htmlFor="fullName">
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={() => setErrors((e) => ({ ...e, name: "" }))}
                      placeholder="Enter your name"
                      className={errors.name ? "has-error" : ""}
                    />
                    {errors.name && (
                      <span className="error-msg">{errors.name}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setErrors((e) => ({ ...e, email: "" }))}
                      placeholder="Enter your email"
                      className={errors.email ? "has-error" : ""}
                    />
                    {errors.email && (
                      <span className="error-msg">{errors.email}</span>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onFocus={() =>
                          setErrors((e) => ({ ...e, phone: "" }))
                        }
                        placeholder="Optional"
                        className={errors.phone ? "has-error" : ""}
                      />
                      {errors.phone && (
                        <span className="error-msg">{errors.phone}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject</label>
                      <input
                        id="subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">
                      Message <span className="req">*</span>
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onFocus={() =>
                        setErrors((e) => ({ ...e, message: "" }))
                      }
                      placeholder="Write your message… (minimum 10 characters)"
                      className={errors.message ? "has-error" : ""}
                    />
                    {errors.message && (
                      <span className="error-msg">{errors.message}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="btn-spinner" />
                        Sending...
                      </>
                    ) : (
                      <>📨 Send Message</>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEW: Office locations ── */}
        <section className="contact-offices">
          <div className="contact-container">
            <header className="section-head gn-reveal">
              <span className="section-tag">Locations</span>
              <h2>
                Our <span className="highlight">Offices</span>
              </h2>
              <p className="section-sub">
                Visit us at any of our regional offices across India.
              </p>
            </header>

            <div className="offices-grid gn-stagger">
              {OFFICES.map((o) => (
                <article key={o.city} className="office-card">
                  <div className="office-icon">📍</div>
                  <h3>{o.city}</h3>
                  <p className="office-address">{o.address}</p>
                  <p className="office-phone">
                    <a href={`tel:${o.phone.replace(/\s+/g, "")}`} className="ct-link">
                      {o.phone}
                    </a>
                  </p>
                  <span className="office-hours">🕐 {o.hours}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEW: FAQ ── */}
        <section className="contact-faq">
          <div className="contact-container">
            <header className="section-head gn-reveal">
              <span className="section-tag">FAQ</span>
              <h2>
                Frequently Asked <span className="highlight">Questions</span>
              </h2>
              <p className="section-sub">
                Quick answers to common questions about our products and
                services.
              </p>
            </header>

            <div className="faq-list gn-stagger">
              {FAQS.map((f, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={f.q}
                    className={`faq-item ${isOpen ? "is-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{f.q}</span>
                      <span className="faq-toggle" aria-hidden="true">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    <div className="faq-answer" hidden={!isOpen}>
                      <p>{f.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Partners */}
        {company &&
          (company.investors?.length > 0 ||
            company.business_partners?.length > 0 ||
            company.international_partners?.length > 0) && (
            <section className="contact-partners">
              <div className="contact-container">
                <header className="section-head gn-reveal">
                  <span className="section-tag">Partners</span>
                  <h2>
                    Our Investors &{" "}
                    <span className="highlight">Strategic Partners</span>
                  </h2>
                </header>

                <div className="partners-grid gn-stagger">
                  {company.investors?.length > 0 && (
                    <div className="partner-card">
                      <h3>Major Investors</h3>
                      <ul>
                        {company.investors.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {company.business_partners?.length > 0 && (
                    <div className="partner-card">
                      <h3>Key Business Partners</h3>
                      <ul>
                        {company.business_partners.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {company.international_partners?.length > 0 && (
                    <div className="partner-card">
                      <h3>International Partners</h3>
                      <ul>
                        {company.international_partners.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

        {/* Manufacturing */}
        <section className="contact-mfg">
          <div className="contact-container">
            <header className="section-head gn-reveal">
              <span className="section-tag">Capacity</span>
              <h2>
                Manufacturing <span className="highlight">Strength</span>
              </h2>
            </header>

            <div className="mfg-grid gn-stagger">
              {MFG_CARDS.map((c) => (
                <article key={c.title} className="mfg-card">
                  <div className="mfg-icon">{c.icon}</div>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="contact-cta gn-reveal">
          <div className="cta-inner">
            <div className="ct-cta-glow" aria-hidden="true" />
            <h2>
              Let's <span className="highlight">Connect</span>
            </h2>
            <p>
              Whether you are a distributor, retailer, or customer — we are
              always happy to hear from you.
            </p>
            <button className="cta-btn" onClick={handleCTAClick} type="button">
              Get in Touch
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;