const express = require("express");
const router = express.Router();
const { apiLimiter } = require("../middleware/rateLimiter");
const authMiddleware = require("../middleware/auth");
const { getExperimentAssignments } = require("../controllers/experimentController");

router.get(
    "/assignments",
    apiLimiter,
    authMiddleware,
    getExperimentAssignments
);

module.exports = router;