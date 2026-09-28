// src/pages/Contact.jsx
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import UserNavbar from "../Navbar/UserNavbar";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import { COMPANY_INFO } from "../config/companyInfo";
import "../Css/contact.css";

const PARTNERS = {
  investors: [
    "Sequoia Capital India",
    "Premji Invest",
    "SoftBank Vision Fund",
    "Temasek Holdings",
    "Multiple Family Offices",
  ],
  business: [
    "Reliance Retail",
    "Amazon India & Global",
    "Flipkart",
    "BigBasket",
    "Walmart India",
  ],
  international: [
    "Costco (USA & Canada)",
    "Tesco (UK)",
    "Carrefour (Middle East)",
    "NTUC FairPrice (Singapore)",
    "Woolworths (Australia)",
  ],
};

const MFG_CARDS = [
  {
    icon: "🏭",
    title: "4 Manufacturing Units",
    desc: "State-of-the-art facilities with modern machinery and strict quality control.",
  },
  {
    icon: "👷",
    title: "850+ Employees",
    desc: "Skilled workforce dedicated to maintaining traditional taste with modern hygiene.",
  },
  {
    icon: "📦",
    title: "Daily Production",
    desc: "Over 45 tonnes of authentic namkeen and snacks produced every day.",
  },
  {
    icon: "🌍",
    title: "Export Ready",
    desc: "Dedicated export facility near Mundra Port for seamless international shipping.",
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

  const SUBMIT_COOLDOWN = 3000;

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
        <div className="contact-container">
          {/* Back */}
          <button
            className="contact-back"
            onClick={() => navigate(-1)}
            type="button"
          >
            ← Back
          </button>
        </div>

        {/* Hero */}
        <section className="contact-hero">
          <div className="contact-hero-inner">
            <span className="contact-eyebrow">Get in Touch</span>
            <h1>
              Contact <span className="highlight">Us</span>
            </h1>
            <p>
              We would love to hear from you. Reach out for business inquiries,
              partnerships, or any questions about our products.
            </p>
          </div>
        </section>

        {/* Main grid */}
        <section className="contact-main">
          <div className="contact-container">
            <div className="contact-grid">
              {/* Company info */}
              <div className="contact-info">
                <h2>Company Details</h2>

                <div className="info-list">
                  <div className="info-item">
                    <span className="info-icon">🏢</span>
                    <div>
                      <h4>Company Name</h4>
                      <p>{COMPANY_INFO.name}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">👤</span>
                    <div>
                      <h4>Founder & Owner</h4>
                      <p>{COMPANY_INFO.founder}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">🏭</span>
                    <div>
                      <h4>Manufacturing Units</h4>
                      <p>
                        {COMPANY_INFO.units.map((unit, idx) => (
                          <span key={idx}>
                            • {unit}
                            {idx < COMPANY_INFO.units.length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <div>
                      <h4>Registered Address</h4>
                      <p>
                        {COMPANY_INFO.address.street}
                        <br />
                        {COMPANY_INFO.address.city}
                        <br />
                        {COMPANY_INFO.address.state}
                      </p>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">📞</span>
                    <div>
                      <h4>Phone</h4>
                      <p>{COMPANY_INFO.contact.phone.join(" | ")}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">✉️</span>
                    <div>
                      <h4>Email</h4>
                      {COMPANY_INFO.contact.email.map((mail, idx) => (
                        <p key={idx}>
                          <a href={`mailto:${mail}`}>{mail}</a>
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="info-item">
                    <span className="info-icon">🌐</span>
                    <div>
                      <h4>Website</h4>
                      <p>
                        <a
                          href={COMPANY_INFO.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {COMPANY_INFO.contact.website}
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="contact-form-wrap" ref={formBoxRef}>
                <h2>Send us a Message</h2>

                {success && (
                  <div className="success-banner" role="alert">
                    ✓ Message sent successfully! We’ll get back to you soon.
                  </div>
                )}

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
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
                        onFocus={() => setErrors((e) => ({ ...e, phone: "" }))}
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
                      onFocus={() => setErrors((e) => ({ ...e, message: "" }))}
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
                      "Send Message"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="contact-partners">
          <div className="contact-container">
            <header className="section-head">
              <span className="section-tag">Partners</span>
              <h2>
                Our Investors & <span className="highlight">Strategic Partners</span>
              </h2>
            </header>

            <div className="partners-grid">
              <div className="partner-card">
                <h3>Major Investors</h3>
                <ul>
                  {PARTNERS.investors.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="partner-card">
                <h3>Key Business Partners</h3>
                <ul>
                  {PARTNERS.business.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="partner-card">
                <h3>International Partners</h3>
                <ul>
                  {PARTNERS.international.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Manufacturing */}
        <section className="contact-mfg">
          <div className="contact-container">
            <header className="section-head">
              <span className="section-tag">Capacity</span>
              <h2>
                Manufacturing <span className="highlight">Strength</span>
              </h2>
            </header>

            <div className="mfg-grid">
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
        <section className="contact-cta">
          <div className="cta-inner">
            <h2>
              Let’s <span className="highlight">Connect</span>
            </h2>
            <p>
              Whether you are a distributor, retailer, or customer — we are
              always happy to hear from you.
            </p>
            <button
              className="cta-btn"
              onClick={handleCTAClick}
              type="button"
            >
              Get in Touch
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;