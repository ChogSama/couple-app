const rateLimit = require("express-rate-limit");

// General API limiter
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 100, // Max 100 requests / IP
    message: {
        message: "Too many requests, please try again later",
    },
});

// Strict limiter (for sensitive endpoints)
exports.strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        message: "Too many actions, slow down",
    },
});