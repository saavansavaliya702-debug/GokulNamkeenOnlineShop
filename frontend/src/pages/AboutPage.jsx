// src/pages/About.jsx
import { useNavigate } from "react-router-dom";
import UserNavbar from "../Navbar/UserNavbar";
import "../Css/about.css";

const TIMELINE = [
  {
    year: "2003",
    title: "The Beginning",
    icon: "🏠",
    desc: "Started as a small family business with traditional recipes and local distribution in Gujarat.",
  },
  {
    year: "2012",
    title: "Expansion",
    icon: "🏭",
    desc: "Set up modern manufacturing units and expanded distribution across major Indian cities.",
  },
  {
    year: "2018",
    title: "Going Global",
    icon: "🌍",
    desc: "Entered international markets. Today our products reach customers in more than 18 countries.",
  },
  {
    year: "2025",
    title: "Current Status",
    icon: "📈",
    desc: "Market capitalization of ₹2,850+ Crore with consistent year-on-year growth.",
  },
];

const MARKETS = [
  {
    icon: "🇮🇳",
    title: "India (Local)",
    desc: "Strong presence across retail, modern trade, and e-commerce in all major cities and towns.",
  },
  {
    icon: "🌎",
    title: "International",
    desc: "Actively exporting to USA, Canada, UK, UAE, Saudi Arabia, Singapore, Australia & Europe.",
  },
  {
    icon: "🛒",
    title: "Retail & Online",
    desc: "Available on Amazon, Flipkart, BigBasket, and leading international grocery platforms.",
  },
  {
    icon: "🤝",
    title: "Distribution",
    desc: "Robust network with partners in 18+ countries, ensuring fresh supply worldwide.",
  },
];

const INVESTORS = [
  "Sequoia Capital India — Early growth investor",
  "Premji Invest — Strategic long-term partner",
  "SoftBank Vision Fund — Significant growth capital",
  "Temasek Holdings — Institutional investment",
  "Multiple Family Offices & HNIs",
];

const HIGHLIGHTS = [
  "Founded in 2003 with traditional recipes",
  "Now a Multinational Corporation (MNC)",
  "Products sold in Local + International markets",
  "Trusted by millions of customers worldwide",
];

const About = () => {
  const navigate = useNavigate();

  return (
    <>
      <UserNavbar />

      <div className="about-page">
        {/* Back */}
        <div className="about-container">
          <button
            className="about-back"
            onClick={() => navigate(-1)}
            type="button"
          >
            ← Back
          </button>
        </div>

        {/* Hero */}
        <section className="about-hero">
          <div className="about-hero-inner">
            <span className="about-eyebrow">Since 2003</span>
            <h1>
              Our <span className="highlight">Journey</span>
            </h1>
            <p>
              From a small family kitchen in Gujarat to a global brand —
              delivering authentic Indian flavors to the world.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="about-story">
          <div className="about-container">
            <div className="story-grid">
              <div className="story-text">
                <span className="section-tag">Our Story</span>
                <h2>About Gokul Namkeen</h2>
                <p>
                  Founded in <strong>2003</strong> in a small kitchen in
                  Gujarat, our company began with a simple mission — to share
                  authentic, homemade-style namkeen and traditional snacks with
                  the world. What started as a local family business has now
                  grown into a respected Multinational Corporation with
                  presence in multiple countries.
                </p>
                <p>
                  Over the last two decades, we have carefully scaled our
                  operations while staying true to our roots. Today, we operate
                  modern manufacturing units, maintain strict quality
                  standards, and supply our products across both local and
                  international markets.
                </p>
                <p>
                  Our range — including Namkeen Mix, Mathri, Chakli, Fafda &
                  Jalebi, and many more — is available in retail stores, modern
                  trade, and export markets across Asia, Middle East, Europe,
                  USA, Canada, and Australia.
                </p>

                <ul className="highlight-list">
                  {HIGHLIGHTS.map((item) => (
                    <li key={item}>
                      <span className="check">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="story-image">
                <img
                  src="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"
                  alt="Traditional Indian snacks"
                  loading="lazy"
                />
                <div className="story-badge">
                  <span className="badge-value">20+</span>
                  <span className="badge-label">Years of Trust</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="about-timeline">
          <div className="about-container">
            <header className="section-head">
              <span className="section-tag">Milestones</span>
              <h2>
                Growth Journey & <span className="highlight">Market Position</span>
              </h2>
            </header>

            <div className="timeline-grid">
              {TIMELINE.map((t) => (
                <article key={t.year} className="timeline-card">
                  <div className="timeline-icon">{t.icon}</div>
                  <span className="timeline-year">{t.year}</span>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Investors */}
        <section className="about-investors">
          <div className="about-container">
            <header className="section-head">
              <span className="section-tag">Partners</span>
              <h2>
                Investors & <span className="highlight">Strategic Partners</span>
              </h2>
              <p className="section-sub">
                Our growth has been supported by some of the most respected
                investors in the food & FMCG sector.
              </p>
            </header>

            <ul className="investor-list">
              {INVESTORS.map((item) => (
                <li key={item}>
                  <span className="check">✓</span>
                  {item}
                </li>
              ))}
            </ul>

            <p className="investor-note">
              These partnerships have helped us modernize manufacturing,
              strengthen our supply chain, and accelerate international
              expansion while preserving the authentic taste customers love.
            </p>
          </div>
        </section>

        {/* Markets */}
        <section className="about-markets">
          <div className="about-container">
            <header className="section-head">
              <span className="section-tag">Reach</span>
              <h2>
                Local + <span className="highlight">International Markets</span>
              </h2>
            </header>

            <div className="markets-grid">
              {MARKETS.map((m) => (
                <article key={m.title} className="market-card">
                  <div className="market-icon">{m.icon}</div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="about-cta">
          <div className="cta-inner">
            <h2>
              From Our Kitchen to the <span className="highlight">World</span>
            </h2>
            <p>
              Experience the authentic taste that has traveled from a small
              family kitchen to global shelves.
            </p>
            <button
              className="cta-btn"
              onClick={() => navigate("/product")}
              type="button"
            >
              Explore Our Products
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

export default About;