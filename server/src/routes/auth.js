const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");
const { apiLimiter, strictLimiter } = require("../middleware/rateLimiter");
const { validateAdvanced } = require("../middleware/validate");

router.post(
    "/register",
    apiLimiter,
    validateAdvanced({
        email: { required: true, isEmail: true },
        password: { required: true, type: "string", minLength: 6 },
        name: { required: true, type: "string", minLength: 2 },
    }),
    register
);

router.post(
    "/login",
    strictLimiter,
    validateAdvanced({
        email: { required: true, isEmail: true },
        password: { required: true, type: "string" },
    }),
    login
);

module.exports = router;