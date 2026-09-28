"use strict";

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");

const app = express();
const PORT = process.env.PORT || 7070;

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health
app.get("/", (req, res) => res.json({ ok: true, msg: "API up" }));
app.get("/api/test", (req, res) => res.json({ message: "API is working" }));

// ── Routers (each mounted once, no catch-all) ──
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/products", require("./routes/ProductRoute"));
app.use("/api/contact", require("./routes/contactRoutes"));

// 404
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled:", err);
  res.status(500).json({ error: err.message });
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB Connected");
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ DB error:", err);
    process.exit(1);
  }
})();