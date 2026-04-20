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

router.post("/", authMiddleware, createVaultItem);
router.get("/", authMiddleware, getMyVault);
router.get("/shared", authMiddleware, getSharedVault);
router.put("/:id", authMiddleware, updateVaultItem);
router.delete("/:id", authMiddleware, deleteVaultItem);

module.exports = router;