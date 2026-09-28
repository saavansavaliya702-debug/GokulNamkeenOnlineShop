require("dotenv").config();
const express = require("express");
const router = express.Router();

// router.use("/onlinestore", require("./OnlineShoppersRoutes"));
router.use("/onlineshoppers", require("./OnlineShoppersRoutes"));
router.use("/products", require("./ProductRoute"));


module.exports = router;
