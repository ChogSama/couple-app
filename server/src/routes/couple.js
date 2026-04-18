const express = require("express");
const router = express.Router();

const { requestCouple, acceptCouple, getMyRelationship } = require("../controllers/coupleController");
const authMiddleware = require("../middleware/auth");

router.post("/request", authMiddleware, requestCouple);
router.post("/accept", authMiddleware, acceptCouple);
router.get("/me", authMiddleware, getMyRelationship);

module.exports = router;