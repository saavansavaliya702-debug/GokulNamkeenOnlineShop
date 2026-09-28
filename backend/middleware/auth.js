"use strict";

const jwt = require("jsonwebtoken");
const { Register } = require("../models");

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId =
      decoded.id ?? decoded.userId ?? decoded.user_id ?? decoded.sub;

    if (!userId) {
      return res.status(401).json({ message: "Malformed token" });
    }

    const user = await Register.findByPk(userId);
    if (!user || user.is_delete) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user?.is_admin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};