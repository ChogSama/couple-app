const express = require("express");
const router = express.Router();

const {
    createVaultItem,
    getMyVault,
    getSharedVault,
    updateVaultItem,
    deleteVaultItem
} = require("../controllers/vaultController");
const authMiddleware = require("../middleware/auth");
const { strictLimiter, apiLimiter } = require("../middleware/rateLimiter");
const { validateAdvanced } = require("../middleware/validate");

router.post(
    "/",
    strictLimiter,
    authMiddleware,
    validateAdvanced({
        itemType: { required: true, type: "string" },
        content: { required: true, type: "string", minLength: 2 },
        isVisibleToPartner: { required: true, isBoolean: true },
    }),
    createVaultItem
);

router.get("/", apiLimiter, authMiddleware, getMyVault);

router.get("/shared", apiLimiter, authMiddleware, getSharedVault);

router.put(
    "/:id",
    strictLimiter,
    authMiddleware,
    validateAdvanced({
        itemType: { required: true, type: "string" },
        content: { required: true, type: "string" },
        isVisibleToPartner: { required: true, isBoolean: true },
    }),
    updateVaultItem
);

router.delete("/:id", strictLimiter, authMiddleware, deleteVaultItem);

module.exports = router;