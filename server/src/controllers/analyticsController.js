const prisma = require("../lib/prisma");

// Track product click
exports.trackClick = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
            });
        }

        // Find the most recent recommendation log for the user and product
        const log = await prisma.recommendationLog.findFirst({
            where: {
                userId,
                productId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!log) {
            return res.status(404).json({
                message: "Recommendation log not found",
            });
        }

        // Update the log to mark it as clicked
        await prisma.recommendationLog.update({
            where: { id: log.id },
            data: {
                isClicked: true,
            },
        });

        return res.status(200).json({
            message: "Click tracked",
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Track product purchase
exports.trackPurchase = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
            });
        }

        // Find the most recent recommendation log for the user and product
        const log = await prisma.recommendationLog.findFirst({
            where: {
                userId,
                productId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        if (!log) {
            return res.status(404).json({
                message: "Recommendation log not found",
            });
        }

        // Update the log to mark it as purchased
        await prisma.recommendationLog.update({
            where: { id: log.id },
            data: {
                isClicked: true,
                isPurchased: true,
            },
        });

        return res.status(200).json({
            message: "Purchase tracked",
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Get analytics stats
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const [
            totalRecommendations,
            totalClicks,
            totalPurchases,
            logs,
        ] = await Promise.all([
            prisma.recommendationLog.count({
                where: { userId },
            }),

            prisma.recommendationLog.count({
                where: {
                    userId,
                    isClicked: true,
                },
            }),

            prisma.recommendationLog.count({
                where: {
                    userId,
                    isPurchased: true,
                },
            }),

            prisma.recommendationLog.findMany({
                where: { userId },
                include: {
                    product: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: 20,
            }),
        ]);

        const ctr =
            totalRecommendations === 0
            ? 0
            : totalClicks / totalRecommendations;

        const conversionRate =
            totalClicks === 0
            ? 0
            : totalPurchases / totalClicks;

        return res.status(200).json({
            stats: {
                totalRecommendations,
                totalClicks,
                totalPurchases,
                ctr,
                conversionRate,
            },
            recentActivity: logs,
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};