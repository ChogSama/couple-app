const prisma = require("../lib/prisma");
const { updateFromBehavior } = require("../services/aiProfileService");

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

        const updatedLog = await prisma.recommendationLog.update({
            where: { id: log.id },
            data: {
                isClicked: true,
            },
            include: {
                product: true,
            },
        });

        // Auto update AI profile based on click behavior
        await updateFromBehavior(userId, updatedLog.product, 0.1);

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

        const updatedLog = await prisma.recommendationLog.update({
            where: { id: log.id },
            data: {
                isClicked: true,
                isPurchased: true,
            },
            include: {
                product: true,
            },
        });

        // Auto update AI profile based on purchase behavior
        await updateFromBehavior(userId, updatedLog.product, 0.3);

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

// Get aggregated stats for analytics dashboard
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.userId;

        const logs = await prisma.recommendationLog.findMany({
            where: { userId },
            include: {
                product: true,
            },
        });

        const totalRecommendations = logs.length;
        const totalClicks = logs.filter((l) => l.isClicked).length;
        const totalPurchases = logs.filter((l) => l.isPurchased).length;

        // CTR and Conversion Rate
        const ctr =
            totalRecommendations === 0
                ? 0
                : totalClicks / totalRecommendations;

        const conversionRate =
            totalClicks === 0
                ? 0
                : totalPurchases / totalClicks;
        
        // Revenue calculation (assuming product has a price field)
        const revenue = logs
            .filter((l) => l.isPurchased)
            .reduce((sum, l) => sum + (l.product?.price || 0), 0);

        // Source breakdown (e.g., which recommendation algorithm performed best)
        const sourceStats = {};

        for (const log of logs) {
            const source = log.source || "UNKNOWN";

            if (!sourceStats[source]) {
                sourceStats[source] = {
                    impressions: 0,
                    clicks: 0,
                    purchases: 0,
                };
            }

            sourceStats[source].impressions++;
            
            if (log.isClicked) sourceStats[source].clicks++;
            if (log.isPurchased) sourceStats[source].purchases++;
        }

        const sourceBreakdown = Object.entries(sourceStats).map(
            ([source, s]) => ({
                source,
                ctr: s.impressions ? s.clicks / s.impressions : 0,
                conversion: s.clicks ? s.purchases / s.clicks : 0,
            })
        );

        // Category performance (assuming product has categories)
        const categoryMap = {};

        for (const log of logs) {
            const category = log.product?.category || "unknown";

            if (!categoryMap[category]) {
                categoryMap[category] = {
                    impressions: 0,
                    clicks: 0,
                    purchases: 0,
                };
            }

            categoryMap[category].impressions++;

            if (log.isClicked) categoryMap[category].clicks++;
            if (log.isPurchased) categoryMap[category].purchases++;
        }

        const topCategories = Object.entries(categoryMap)
            .map(([category, s]) => ({
                category,
                ctr: s.impressions ? s.clicks / s.impressions : 0,
                conversion: s.clicks ? s.purchases / s.clicks : 0,
            }))
            .sort((a, b) => b.ctr - a.ctr)
            .slice(0, 5);
        
        // Context reason analytics
        const reasonMap = {};

        for (const log of logs) {
            const reason = log.context?.reason || "unknown";

            reasonMap[reason] = (reasonMap[reason] || 0) + 1;
        }

        const topReasons = Object.entries(reasonMap)
            .map(([reason, count]) => ({
                reason,
                count,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Engagement score (improved)
        const engagementScore =
            totalRecommendations === 0
                ? 0
                : (totalClicks * 0.6 + totalPurchases * 1.2) /
                    totalRecommendations;

        return res.status(200).json({
            stats: {
                totalRecommendations,
                totalClicks,
                totalPurchases,
                ctr,
                conversionRate,
                revenue,
                engagementScore,
            },
            breakdown: {
                bySource: sourceBreakdown,
                topCategories,
                topReasons,
            },
            recentActivity: logs.slice(-20).reverse(),
        });
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};