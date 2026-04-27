const prisma = require("../lib/prisma");

// Get partner's id
async function getPartnerId(userId) {
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

// Extract tags from vault items
function extractTagsFromVault(vaultItems) {
    const stopWords = ["i", "and", "or", "the", "a", "love", "like", "likes"];

    const tags = vaultItems.flatMap((v) => 
        v.content
            .toLowerCase()
            .split(/[\s,]+/)
            .filter(word => word && !stopWords.includes(word))
    );

    return [...new Set(tags)];
}

function normalize(tag) {
    return tag.toLowerCase().trim();
}

// Safe number conversion
function safe(n) {
    return Number.isFinite(n) ? n : 0;
}

// Get vault score based on tag matches
function getVaultScore(product, vaultTags) {
    if (!vaultTags.length) return 0;

    const normalizedUserTags = vaultTags.map(normalize);
    const normalizedProductTags = product.tags.map(normalize);

    const matchCount = normalizedProductTags.filter((tag) =>
        normalizedUserTags.includes(tag)
    ).length;

    return matchCount / (normalizedProductTags.length || 1);
}

// Get AI score based on user profile preferences
function getAIScore(product, userProfileAI) {
    if (!userProfileAI?.preferenceScore) return 0;

    let score = 0;

    for (const tag of product.tags.map(normalize)) {
        score += userProfileAI.preferenceScore[tag] || 0;
    }

    return Math.min(score, 1);
}

// Get behavior score based on past interactions
async function getBehaviorScore(userId, productId) {
    const logs = await prisma.recommendationLog.findMany({
        where: { userId, productId },
    });

    let score = 0;

    logs.forEach((l) => {
        if (l.isClicked) score += 0.2;
        if (l.isPurchased) score += 0.5;
    });

    return Math.min(score, 1);
}

// Get trending score based on overall popularity
async function getTrendingScore(productId) {
    const count = await prisma.recommendationLog.count({
        where: {
            productId,
            isClicked: true,
        }
    });

    return Math.min(count / 50, 1);
}

// Get gift recommendations
exports.getGiftRecommendations = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Get partner id
        const partnerId = await getPartnerId(userId);
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
            },
        });

        const vaultTags = extractTagsFromVault(vaultItems);

        // Get AI profile
        const userProfileAI = await prisma.userProfileAI.findUnique({
            where: { userId },
        });

        const aiTags = userProfileAI?.tags || [];

        // Merge tags
        const combinedTags = [...new Set([...vaultTags, ...aiTags])];

        // Fetch products matching tags
        let products = [];

        if (combinedTags.length > 0) {
            products = await prisma.product.findMany({
                where: {
                    tags: {
                        hasSome: combinedTags,
                    },
                },
                take: 20,
            });
        }

        // Fallback to popular products if no matches
        if (products.length === 0) {
            products = await prisma.product.findMany({
                orderBy: {
                    createdAt: "desc",
                },
                take: 10,
            });
        }

        const scored = [];
        
        for (const p of products) {
            const vaultScore = getVaultScore(p, vaultTags);
            const aiScore = getAIScore(p, userProfileAI);
            const behaviorScore = await getBehaviorScore(userId, p.id);
            const trendingScore = await getTrendingScore(p.id);

            const finalScore = safe(
                0.4 * vaultScore +
                0.3 * aiScore +
                0.2 * behaviorScore +
                0.1 * trendingScore
            );

            const matchedTags = p.tags.filter((tag) =>
                vaultTags.includes(tag)
            );

            scored.push({
                productId: p.id,
                name: p.name,
                score: finalScore,
                reason: `
                vault: ${vaultScore.toFixed(2)}
                ai: ${aiScore.toFixed(2)}
                behavior: ${behaviorScore.toFixed(2)}
                trend: ${trendingScore.toFixed(2)}
                ${matchedTags.length ? `match: ${matchedTags.join(",")}` : ""}
                    `.trim(),
            });
        }

        // Sort by score
        scored.sort((a, b) => b.score - a.score);

        const topResults = scored.slice(0, 10);

        // Logging for debugging
        const logs = topResults.map((r) => ({
            userId,
            productId: r.productId,
            score: r.score,
            source:
                vaultTags.length > 0
                    ? "VAULT"
                    : aiTags.length > 0
                    ? "AI"
                    : "TRENDING",
            context: {
                vaultTags,
                aiTags,
            },
        }));

        if (logs.length > 0) {
            await prisma.recommendationLog.createMany({
                data: logs,
            });
        }

        return res.status(200).json(topResults);
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