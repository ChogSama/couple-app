const prisma = require("../lib/prisma");
const { getGiftRecommendations } = require("../services/recommendService");

// Get gift recommendations
exports.getGiftRecommendations = async (req, res) => {
    try {
        const { results, context } =
            await getGiftRecommendations(req.user.userId);
        
        await prisma.recommendationLog.createMany({
            data: results.map((r) => ({
                userId: req.user.userId,
                productId: r.productId,
                score: r.score,
                source: r.source,
                context: {
                    ...context,
                    explanation: r.reason,
                    primaryReason: r.primaryReason,
                },
            })),
        });

        res.status(200).json(results);
    } catch (err) {
        res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// Get date ideas
exports.getDateIdeas = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Personalize date ideas based on AI profile
        const userProfileAI = await prisma.userProfileAI.findUnique({
            where: { userId },
        });

        let ideas = [
            { id: 1, title: "Romantic Dinner", tags: ["food", "romantic"] },
            { id: 2, title: "Coffee Date", tags: ["coffee", "casual"] },
            { id: 3, title: "Movie Night", tags: ["movie", "indoor"] },
            { id: 4, title: "Picnic", tags: ["outdoor", "romantic"] },
        ];

        // Simple scoring based on AI profile tags
        const scored = ideas.map((idea) => {
            let score = 0;

            if (userProfileAI?.preferenceScore) {
                for (const tag of idea.tags) {
                    if (userProfileAI.preferenceScore[tag]) {
                        score += userProfileAI.preferenceScore[tag];
                    }
                }
            }

            return {
                id: idea.id,
                title: idea.title,
                score: Math.min(score || 0.7, 1), // Fallback to 0.7 if no AI data
            };
        });

        scored.sort((a, b) => b.score - a.score);

        return res.status(200).json(scored);
    } catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};