// src/config/companyInfo.js
// ─────────────────────────────────────────────────────────────
// Company Information — used across Contact, About, Footer, etc.
// ─────────────────────────────────────────────────────────────

export const COMPANY_INFO = {
  /* ─── Identity ─── */
  name: "Gokul Namkeen",
  legalName: "Shree Authentic Foods Pvt. Ltd. (MNC)",
  tagline: "Authentic & Delicious Snacks & Sweets",
  founder: "Mr. Savan Savaliya",
  foundedYear: 2024,
  description:
    "With over 2 years of experience, Gokul Namkeen has been serving authentic traditional snacks and sweets to families across the region.",

  /* ─── Manufacturing Units ─── */
  units: [
    "Unit 1: Ahmedabad, Gujarat (Head Office & Main Plant)",
    "Unit 2: Surat, Gujarat",
    "Unit 3: Indore, Madhya Pradesh",
    "Export Facility: Mundra Port, Gujarat",
  ],

  /* ─── Registered Address ─── */
  address: {
    street: "Plot No. 45, GIDC Industrial Estate",
    area: "Vatva",
    city: "Ahmedabad – 382445",
    state: "Gujarat, India",
    country: "India",
    full: "Plot No. 45, GIDC Industrial Estate, Vatva, Ahmedabad – 382445, Gujarat, India",
  },

  /* ─── Contact ─── */
  contact: {
    phone: [
      "+91 79 2589 4500",
      "+91 98765 43210",
    ],
    email: [
      "info@shreeauthenticfoods.com",
      "export@shreeauthenticfoods.com",
    ],
    website: "www.shreeauthenticfoods.com",
    whatsapp: "+91 98765 43210",
  },

  /* ─── Social Media ─── */
  social: {
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/?hl=en",
    twitter: "https://x.com/",
    youtube: "https://www.youtube.com/",
    linkedin: "https://www.linkedin.com/",
  },

  /* ─── Business Stats ─── */
  stats: {
    yearsExperience: "20+",
    manufacturingUnits: 4,
    employees: "850+",
    dailyProduction: "45 tonnes",
    happyCustomers: "1M+",
    citiesServed: "200+",
  },

  /* ─── Partners ─── */
  partners: {
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
  },

  /* ─── Manufacturing Highlights ─── */
  manufacturing: [
    {
      icon: "🏭",
      title: "4 Manufacturing Units",
      description:
        "State-of-the-art facilities with modern machinery and strict quality control.",
    },
    {
      icon: "👷",
      title: "850+ Employees",
      description:
        "Skilled workforce dedicated to maintaining traditional taste with modern hygiene.",
    },
    {
      icon: "📦",
      title: "Daily Production",
      description:
        "Over 45 tonnes of authentic namkeen and snacks produced every day.",
    },
    {
      icon: "🌍",
      title: "Export Ready",
      description:
        "Dedicated export facility near Mundra Port for seamless international shipping.",
    },
  ],

  /* ─── Values ─── */
  values: [
    {
      icon: "🌾",
      title: "Authentic Recipes",
      description:
        "Traditional recipes passed down through generations, made with love and care.",
    },
    {
      icon: "✨",
      title: "Premium Quality",
      description:
        "Only the finest ingredients sourced from trusted suppliers across India.",
    },
    {
      icon: "🚚",
      title: "Fast Delivery",
      description:
        "Quick and reliable shipping to your doorstep, anywhere in India.",
    },
    {
      icon: "💚",
      title: "Healthy Choice",
      description:
        "No artificial flavors or harmful preservatives — just pure, natural goodness.",
    },
  ],
};

export default COMPANY_INFO;