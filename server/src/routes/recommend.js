const express = require("express");
const router = express.Router();

const { getGiftRecommendations, getDateIdeas } = require("../controllers/recommendController");
const authMiddleware = require("../middleware/auth");

router.get("/gifts", authMiddleware, getGiftRecommendations);
router.get("/dates", authMiddleware, getDateIdeas);

module.exports = router;