const express = require("express");
const router = express.Router();

const { getGiftRecommendations, getDateIdeas, getRecommendationExplanation } = require("../controllers/recommendController");
const { trackClick, trackPurchase, getStats } = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/auth");
const { strictLimiter, apiLimiter } = require("../middleware/rateLimiter");
const { validateAdvanced } = require("../middleware/validate");

router.get("/gifts", strictLimiter, authMiddleware, getGiftRecommendations);

router.get("/dates", apiLimiter, authMiddleware, getDateIdeas);

router.get(
    "/explanation/:productId",
    apiLimiter,
    authMiddleware,
    getRecommendationExplanation
);

router.post(
    "/click",
    strictLimiter,
    authMiddleware,
    validateAdvanced({
        productId: { required: true, type: "number" },
    }),
    trackClick
);

router.post(
    "/purchase",
    strictLimiter,
    authMiddleware,
    validateAdvanced({
        productId: { required: true, type: "number" },
    }),
    trackPurchase
);

router.get("/stats", apiLimiter, authMiddleware, getStats);

module.exports = router;