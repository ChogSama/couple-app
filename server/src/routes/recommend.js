const express = require("express");
const router = express.Router();

const { getGiftRecommendations, getDateIdeas } = require("../controllers/recommendController");
const { trackClick, trackPurchase, getStats } = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/auth");

router.get("/gifts", authMiddleware, getGiftRecommendations);
router.get("/dates", authMiddleware, getDateIdeas);
router.post("/click", authMiddleware, trackClick);
router.post("/purchase", authMiddleware, trackPurchase);
router.get("/stats", authMiddleware, getStats);

module.exports = router;