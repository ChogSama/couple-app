const prisma = require("../lib/prisma");

// Get partner's id
async function getParterId(userId) {
    const relationship = await prisma.relationship.findFirst({
        where: {
            status: "CONNECTED",
            OR: [
                { user1Id: userId },
                { user2Id: userId },
            ]
        }
    });

    if (!relationship) return null;

    return relationship.user1Id === userId
        ? relationship.user2Id
        : relationship.user1Id;
}

// Get gift recommendations
exports.getGiftRecommendations = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get partner id
        const partnerId = await getParterId(userId);
        if (!partnerId) {
            return res.status(400).json({
                message: "No partner connected",
            });
        }

        // Get partner's vault items
        const vaultItems = await prisma.secretVault.findMany({
            where: {
                ownerId: partnerId,
                isVisibleToPartner: true,
            }
        });

        // Extract tags from vault items
        const tags = vaultItems.map(v => v.itemType);

        // Find products matching the tags
        const products = await prisma.product.findMany({
            where: {
                tags: {
                    hasSome: tags,
                }
            },
            take: 10,
        });

        // Format results
        const results = products.map(p => ({
            productId: p.id,
            name: p.name,
            score: 0.8, // Static score for demo purposes
        }));

        // Log recommendations
        const logs = products.map(p => ({
            userId,
            productId: p.id,
            score: 0.8,
            source: "VAULT",
        }));

        if (logs.length > 0) {
            await prisma.recommendationLog.createMany({
                data: logs,
            });
        }

        return res.json(results);
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Get date ideas
exports.getDateIdeas = async (req, res) => {
    try {
        const ideas = [
            { id: 1, title: "Romantic Dinner", score: 0.9 },
            { id: 2, title: "Coffee Date", score: 0.8 },
            { id: 3, title: "Movie Night", score: 0.85 },
        ];

        return res.json(ideas);
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};