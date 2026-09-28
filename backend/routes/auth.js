// // routes/auth.js (FIXED VERSION)
// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { Register } = require("../models");
// const { sendOtpEmail } = require("../utils/mailer");

// // ⚠️ SECURITY: Get from environment, don't use fallback in production
// const JWT_SECRET = process.env.JWT_SECRET;
// if (!JWT_SECRET) {
//   throw new Error("❌ JWT_SECRET environment variable is not set!");
// }

// const OTP_TTL_MINUTES = 5;
// const BCRYPT_ROUNDS = 10;

// // ─────────────────────────────
// // UTILITY FUNCTIONS
// // ─────────────────────────────

// function generateOtp() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }

// // Validate email format
// function isValidEmail(email) {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// }

// // ─────────────────────────────
// // POST /api/auth/register
// // ─────────────────────────────
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, confirmPassword } = req.body;

//     // ✅ Validation checks
//     if (!name || !email || !password || !confirmPassword) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     if (!isValidEmail(email)) {
//       return res.status(400).json({ message: "Invalid email format" });
//     }

//     if (password.length < 6) {
//       return res
//         .status(400)
//         .json({ message: "Password must be at least 6 characters" });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     // ✅ Case-insensitive email lookup
//     const existingUser = await Register.findOne({
//       where: { email: email.toLowerCase() },
//     });

//     if (existingUser && existingUser.is_verified) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
//     const otp = generateOtp();
//     const otp_expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

//     let user;
//     try {
//       if (existingUser) {
//         // Update existing unverified user
//         existingUser.name = name;
//         existingUser.password = hashedPassword;
//         existingUser.otp = otp;
//         existingUser.otp_expires_at = otp_expires_at;
//         await existingUser.save();
//         user = existingUser;
//       } else {
//         // Create new user
//         user = await Register.create({
//           name,
//           email: email.toLowerCase(),
//           password: hashedPassword,
//           otp,
//           otp_expires_at,
//           is_verified: false,
//         });
//       }
//     } catch (dbError) {
//       console.error("Database error during user creation:", dbError);
//       return res.status(500).json({ message: "Error creating user account" });
//     }

//     // Send OTP email (don't block if it fails)
//     try {
//       await sendOtpEmail(email, otp);
//       console.log(`📧 OTP email sent to ${email}`);
//     } catch (mailErr) {
//       console.error("Failed to send OTP email:", mailErr);
//       // ✅ Still return success - email can be resent
//     }

//     res.status(201).json({
//       success: true,
//       message: "Registration successful. Check your email for OTP.",
//       email: user.email,
//     });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ message: "Server error during registration" });
//   }
// });

// // ─────────────────────────────
// // POST /api/auth/verify-otp
// // ─────────────────────────────
// router.post("/verify-otp", async (req, res) => {
//   try {
//     const { email, otp } = req.body;

//     if (!email || !otp) {
//       return res.status(400).json({ message: "Email and OTP are required" });
//     }

//     // ✅ Case-insensitive lookup
//     const user = await Register.findOne({
//       where: { email: email.toLowerCase() },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.is_verified) {
//       return res.status(400).json({ message: "User already verified" });
//     }

//     if (!user.otp || !user.otp_expires_at) {
//       return res
//         .status(400)
//         .json({ message: "No OTP found. Please register again." });
//     }

//     // ✅ Check OTP expiration
//     if (new Date() > new Date(user.otp_expires_at)) {
//       // Auto-generate new OTP for resend
//       user.otp = generateOtp();
//       user.otp_expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
//       await user.save();

//       try {
//         await sendOtpEmail(user.email, user.otp);
//       } catch (mailErr) {
//         console.error("Failed to send new OTP:", mailErr);
//       }

//       return res.status(400).json({
//         message: "OTP expired. A new OTP has been sent to your email.",
//       });
//     }

//     // ✅ Verify OTP matches (trim and compare as strings)
//     if (user.otp !== String(otp).trim()) {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     // ✅ Mark as verified and clear OTP
//     user.is_verified = true;
//     user.otp = null;
//     user.otp_expires_at = null;
//     await user.save();

//     // ✅ Generate JWT token
//     const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
//       expiresIn: "7d",
//     });

//     res.status(200).json({
//       success: true,
//       message: "Email verified successfully",
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.error("Verify OTP error:", error);
//     res.status(500).json({ message: "Server error during OTP verification" });
//   }
// });

// // ─────────────────────────────
// // POST /api/auth/resend-otp
// // ─────────────────────────────
// router.post("/resend-otp", async (req, res) => {
//   try {
//     const { email } = req.body;

//     if (!email) {
//       return res.status(400).json({ message: "Email is required" });
//     }

//     // ✅ Case-insensitive lookup
//     const user = await Register.findOne({
//       where: { email: email.toLowerCase() },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.is_verified) {
//       return res.status(400).json({ message: "User already verified" });
//     }

//     // ✅ Generate fresh OTP
//     const otp = generateOtp();
//     user.otp = otp;
//     user.otp_expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
//     await user.save();

//     try {
//       await sendOtpEmail(user.email, otp);
//       console.log(`📧 Resent OTP email to ${user.email}`);
//     } catch (mailErr) {
//       console.error("Failed to resend OTP email:", mailErr);
//     }

//     res.status(200).json({
//       success: true,
//       message: "OTP resent to your email",
//     });
//   } catch (error) {
//     console.error("Resend OTP error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // ─────────────────────────────
// // POST /api/auth/login
// // ─────────────────────────────
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required" });
//     }

//     const user = await Register.findOne({
//       where: { email: email.toLowerCase() },
//     });

//     if (!user) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     if (!user.is_verified) {
//       if (
//         !user.otp ||
//         !user.otp_expires_at ||
//         new Date() > new Date(user.otp_expires_at)
//       ) {
//         user.otp = generateOtp();
//         user.otp_expires_at = new Date(
//           Date.now() + OTP_TTL_MINUTES * 60 * 1000,
//         );
//         await user.save();

//         try {
//           await sendOtpEmail(user.email, user.otp);
//           console.log(`📧 OTP email sent to ${user.email}`);
//         } catch (mailErr) {
//           console.error("Failed to send OTP email:", mailErr);
//         }
//       }

//       return res.status(403).json({
//         success: false,
//         message: "Please verify your email with OTP first",
//         requiresOtp: true,
//         email: user.email,
//       });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid email or password" });
//     }

//     // ✅ JWT now includes is_admin
//     const token = jwt.sign(
//       { userId: user.id, email: user.email, is_admin: user.is_admin },
//       JWT_SECRET,
//       { expiresIn: "7d" },
//     );

//     // ✅ Response now includes is_admin
//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         is_admin: user.is_admin, // ← THE FIX
//       },
//     });
//   } catch (error) {
//     console.error("Login error:", error);
//     res.status(500).json({ message: "Server error during login" });
//   }
// });

// // ─────────────────────────────
// // GET /api/auth/me
// // ─────────────────────────────
// router.get("/me", async (req, res) => {
//   try {
//     // ✅ Safer token extraction
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No valid token provided" });
//     }

//     const token = authHeader.substring(7); // Remove "Bearer "

//     let decoded;
//     try {
//       decoded = jwt.verify(token, JWT_SECRET);
//     } catch (jwtError) {
//       return res.status(401).json({ message: "Invalid or expired token" });
//     }

//     const user = await Register.findByPk(decoded.userId, {
//       attributes: {
//         exclude: ["password", "otp", "otp_expires_at"],
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.status(200).json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     console.error("Auth error:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;

// routes/auth.js — COMPLETE FIXED VERSION
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Register } = require("../models");
const { sendOtpEmail } = require("../utils/mailer");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET environment variable is not set!");
}

const OTP_TTL_MINUTES = 5;
const BCRYPT_ROUNDS = 10;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─────────────────────────────
// POST /api/auth/register
// ─────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await Register.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const otp = generateOtp();
    const otp_expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    let user;
    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otp_expires_at = otp_expires_at;
      await existingUser.save();
      user = existingUser;
    } else {
      user = await Register.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        otp,
        otp_expires_at,
        is_verified: false,
        is_admin: false,
      });
    }

    try {
      await sendOtpEmail(email, otp);
      console.log(`📧 OTP email sent to ${email}`);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful. Check your email for OTP.",
      email: user.email,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// ─────────────────────────────
// POST /api/auth/verify-otp  ⭐ FIXED
// ─────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await Register.scope("withSecrets").findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (!user.otp || !user.otp_expires_at) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please register again." });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      user.otp = generateOtp();
      user.otp_expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
      await user.save();

      try {
        await sendOtpEmail(user.email, user.otp);
      } catch (mailErr) {
        console.error("Failed to send new OTP:", mailErr);
      }

      return res.status(400).json({
        message: "OTP expired. A new OTP has been sent to your email.",
      });
    }

    if (user.otp !== String(otp).trim()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.is_verified = true;
    user.otp = null;
    user.otp_expires_at = null;
    await user.save();

    // ✅ JWT includes is_admin
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // ✅ Response includes is_admin
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
});

// ─────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await Register.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.is_verified)
      return res.status(400).json({ message: "User already verified" });

    const otp = generateOtp();
    user.otp = otp;
    user.otp_expires_at = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await user.save();

    try {
      await sendOtpEmail(user.email, otp);
    } catch (mailErr) {
      console.error("Failed to resend OTP email:", mailErr);
    }

    res
      .status(200)
      .json({ success: true, message: "OTP resent to your email" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────
// POST /api/auth/login  ⭐ FIXED
// ─────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await Register.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.is_verified) {
      if (
        !user.otp ||
        !user.otp_expires_at ||
        new Date() > new Date(user.otp_expires_at)
      ) {
        user.otp = generateOtp();
        user.otp_expires_at = new Date(
          Date.now() + OTP_TTL_MINUTES * 60 * 1000,
        );
        await user.save();

        try {
          await sendOtpEmail(user.email, user.otp);
          console.log(`📧 OTP email sent to ${user.email}`);
        } catch (mailErr) {
          console.error("Failed to send OTP email:", mailErr);
        }
      }

      return res.status(403).json({
        success: false,
        message: "Please verify your email with OTP first",
        requiresOtp: true,
        email: user.email,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ JWT includes is_admin
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    // ✅ Response includes is_admin
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// ─────────────────────────────
// GET /api/auth/me
// ─────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No valid token provided" });
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await Register.findByPk(decoded.userId, {
      attributes: { exclude: ["password", "otp", "otp_expires_at"] },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
