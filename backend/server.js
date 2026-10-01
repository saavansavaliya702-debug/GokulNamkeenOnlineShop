require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const sequelize = require("./config/database");
const db = require("./models");

const app = express();
const PORT = process.env.PORT || 7070;

/* ═══════════════════════════════════════════════════════════════
   MIDDLEWARE
   ═══════════════════════════════════════════════════════════════ */
app.use(
  cors({
    origin: ["https://gokulnamkeenonlineshop-frontpage.onrender.com"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Razorpay */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* Nodemailer */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOTP = () => crypto.randomInt(100000, 999999).toString();

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p style="color: #666; font-size: 16px;">Hello,</p>
        <p style="color: #666; font-size: 16px;">Your OTP verification code is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">This is an automated message, please do not reply.</p>
      </div>
    `,
  };
  return await transporter.sendMail(mailOptions);
};

/* ═══════════════════════════════════════════════════════════════
   ROUTES
   ═══════════════════════════════════════════════════════════════ */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/products", require("./routes/ProductRoute"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrders"));
app.use("/api/admin/dashboard", require("./routes/adminDashboard"));
app.use("/api/company-info", require("./routes/companyInfoRoutes"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ═══════════════════════════════════════════════════════════════
   OTP ENDPOINTS
   ═══════════════════════════════════════════════════════════════ */
const otpStore = new Map();

app.post("/api/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = generateOTP();
    otpStore.set(email, { otp, timestamp: Date.now(), attempts: 0 });

    await sendOTPEmail(email, otp);
    res.status(200).json({ message: "OTP sent successfully", email });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ error: "OTP not found or expired" });
    }

    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      otpStore.delete(email);
      return res.status(400).json({ error: "OTP has expired" });
    }

    if (storedData.attempts >= 3) {
      otpStore.delete(email);
      return res
        .status(400)
        .json({ error: "Too many attempts. Please request a new OTP" });
    }

    if (storedData.otp === otp) {
      otpStore.delete(email);
      return res
        .status(200)
        .json({ message: "OTP verified successfully", verified: true });
    }

    storedData.attempts += 1;
    otpStore.set(email, storedData);
    const remaining = 3 - storedData.attempts;
    return res.status(400).json({
      error: `Invalid OTP. ${remaining} attempts remaining`,
      attempts: storedData.attempts,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

app.post("/api/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = generateOTP();
    otpStore.set(email, { otp, timestamp: Date.now(), attempts: 0 });

    await sendOTPEmail(email, otp);
    res.status(200).json({ message: "OTP resent successfully", email });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

/* Health check */
app.get("/api/test", (req, res) => res.json({ message: "API is working" }));

/* ═══════════════════════════════════════════════════════════════
   404 + ERROR HANDLERS — MUST BE LAST
   ═══════════════════════════════════════════════════════════════ */
app.use((req, res) => res.status(404).json({ error: "Not Found" }));

app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (max 5 MB)" });
  }
  if (err.message === "Only image files allowed") {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: err.message || "Server error" });
});

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ DB Connected");
    console.log("✅ Tables synced");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to connect to DB:", error);
  }
})();
