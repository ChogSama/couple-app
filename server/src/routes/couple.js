const express = require("express");
const router = express.Router();

const { requestCouple, acceptCouple, getMyRelationship } = require("../controllers/coupleController");
const authMiddleware = require("../middleware/auth");
const { strictLimiter, apiLimiter } = require("../middleware/rateLimiter");
const { validateAdvanced } = require("../middleware/validate");
const { relationship } = require("../lib/prisma");

router.post(
    "/request",
    strictLimiter,
    authMiddleware,
    validateAdvanced({
        partnerEmail: { required: true, isEmail: true },
    }),
    requestCouple
);

router.post(
    "/accept",
    strictLimiter, 
    authMiddleware,
    validateAdvanced({
        relationshipId: { required: true, type: "number" },
    }),
    acceptCouple
);

router.get("/me", apiLimiter, authMiddleware, getMyRelationship);

module.exports = router;