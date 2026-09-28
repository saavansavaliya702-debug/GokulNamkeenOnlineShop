"use strict";

const jwt = require("jsonwebtoken");
const { Register } = require("../models");

module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Support both `id` and `userId` JWT payloads
    const userId = decoded.id ?? decoded.userId ?? decoded.user_id ?? decoded.sub;

    if (!userId) {
      return res.status(401).json({ message: "Malformed token" });
    }

    const user = await Register.findByPk(userId);

    if (!user || user.is_delete || !user.is_admin) {
      return res.status(403).json({ message: "Admin access only" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};