const express = require("express");
const { apiLimiter } = require("../middleware/rateLimiter");
const authMiddleware = require("../middleware/auth");
const { getTopVendors } = require("../controllers/vendorController");
const router = express.Router();

router.get(
    "/top",
    apiLimiter,
    authMiddleware,
    getTopVendors
);

module.exports = router;