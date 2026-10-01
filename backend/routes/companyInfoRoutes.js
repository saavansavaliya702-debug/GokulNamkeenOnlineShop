// backend/routes/companyInfoRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const { CompanyInfo } = require("../models");

/* ─── GET /api/company-info — public ─── */
router.get("/", async (req, res) => {
  try {
    let info = await CompanyInfo.findOne();
    if (!info) info = await CompanyInfo.create({});
    res.json(info);
  } catch (err) {
    console.error("GET /company-info:", err);
    res.status(500).json({ message: "Failed to load company info" });
  }
});

/* ─── PUT /api/company-info — admin only ─── */
router.put("/", protect, adminOnly, async (req, res) => {
  try {
    let info = await CompanyInfo.findOne();
    if (!info) info = await CompanyInfo.create({});

    const {
      name,
      founder,
      units,
      address_street,
      address_city,
      address_state,
      phones,
      emails,
      website,
      facebook,
      instagram,
      twitter,
      tagline,
      description,
      investors,
      business_partners,
      international_partners,
    } = req.body;

    await info.update({
      name: name ?? info.name,
      founder: founder ?? info.founder,
      units: Array.isArray(units) ? units : info.units,
      address_street: address_street ?? info.address_street,
      address_city: address_city ?? info.address_city,
      address_state: address_state ?? info.address_state,
      phones: Array.isArray(phones) ? phones : info.phones,
      emails: Array.isArray(emails) ? emails : info.emails,
      website: website ?? info.website,
      facebook: facebook ?? info.facebook,
      instagram: instagram ?? info.instagram,
      twitter: twitter ?? info.twitter,
      tagline: tagline ?? info.tagline,
      description: description ?? info.description,
      investors: Array.isArray(investors) ? investors : info.investors,
      business_partners: Array.isArray(business_partners)
        ? business_partners
        : info.business_partners,
      international_partners: Array.isArray(international_partners)
        ? international_partners
        : info.international_partners,
    });

    res.json(info);
  } catch (err) {
    console.error("PUT /company-info:", err);
    res.status(500).json({ message: "Failed to update company info" });
  }
});

module.exports = router;