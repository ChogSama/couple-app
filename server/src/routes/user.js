const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const { apiLimiter } = require("../middleware/rateLimiter");

router.get("/me", apiLimiter, authMiddleware, (req, res) => {
    res.json({
        message: "Authorized",
        user: req.user,
    });
});

module.exports = router;