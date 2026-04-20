const prisma = require("../lib/prisma");

// Create vault item
exports.createVaultItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { itemType, content, isVisibleToPartner } = req.body;

        // Validation
        if (!itemType || !content) {
            return res.status(400).json({
                message: "Missing required fields",
            });
        }

        if (content.length > 1000) {
            return res.status(400).json({
                message: "Content too long",
            });
        }

        const item = await prisma.secretVault.create({
            data: {
                ownerId: userId,
                itemType,
                content,
                isVisibleToPartner: isVisibleToPartner ?? false,
            },
        });

        return res.status(201).json({
            message: "Vault item created",
            data: item,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Get my vault
exports.getMyVault = async (req, res) => {
    try {
        const userId = req.user.userId;

        const items = await prisma.secretVault.findMany({
            where: { ownerId: userId },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            data: items,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Get partner shared vault
exports.getSharedVault = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find connected relationship
        const relationship = await prisma.relationship.findFirst({
            where: {
                OR: [
                    { user1Id: userId },
                    { user2Id: userId },
                ],
                status: "CONNECTED",
            },
        });

        if (!relationship) {
            return res.status(400).json({
                message: "No connected partner",
            });
        }

        // Determine partnerId
        const partnerId =
            relationship.user1Id === userId
                ? relationship.user2Id
                : relationship.user1Id;

        const items = await prisma.secretVault.findMany({
            where: {
                ownerId: partnerId,
                isVisibleToPartner: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return res.status(200).json({
            data: items,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Update vault item
exports.updateVaultItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const { itemType, content, isVisibleToPartner } = req.body;

        const existing = await prisma.secretVault.findUnique({
            where: { id: Number(id) },
        });

        if (!existing) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        // Owner only
        if (existing.ownerId !== userId) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        const updated = await prisma.secretVault.update({
            where: { id: existing.id },
            data: {
                itemType: itemType ?? existing.itemType,
                content: content ?? existing.content,
                isVisibleToPartner:
                    isVisibleToPartner ?? existing.isVisibleToPartner,
            },
        });

        return res.status(200).json({
            message: "Updated",
            data: updated,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Delete vault item
exports.deleteVaultItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const existing = await prisma.secretVault.findUnique({
            where: { id: Number(id) },
        });

        if (!existing) {
            return res.status(404).json({
                message: "Item not found",
            });
        }

        if (existing.ownerId !== userId) {
            return res.status(403).json({
                message: "Not authorized",
            });
        }

        await prisma.secretVault.delete({
            where: { id: existing.id },
        });

        return res.status(200).json({
            message: "Deleted",
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};