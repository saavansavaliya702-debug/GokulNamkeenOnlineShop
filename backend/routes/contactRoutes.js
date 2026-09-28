const express = require("express");
const router = express.Router();
const contactController = require("../controller/contactController");
const { protect, adminOnly } = require("../middleware/auth");

// Public route (users can submit the form)
router.post("/", contactController.createContact);

// Admin-only routes
router.get("/", protect, adminOnly, contactController.getAllContacts);
router.delete("/:id", protect, adminOnly, contactController.deleteContact);

module.exports = router;