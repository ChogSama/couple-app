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

// Calculate recommendation score based on tags and AI profile
function calculateScore(product, userTags, userProfileAI) {
    let score = 0;

    const normalizedUserTags = userTags.map(normalize);
    const normalizedProductTags = product.tags.map(normalize);

    // VAULT match
    const matchCount = normalizedProductTags.filter((tag) =>
        normalizedUserTags.includes(tag)
    ).length;

    score = matchCount * 0.4;

    // AI profile match
    if (userProfileAI?.preferenceScore) {
        for (const tag of normalizedProductTags) {
            if (userProfileAI.preferenceScore[tag]) {
                score += userProfileAI.preferenceScore[tag] * 0.6;
            }
        }
    }

    return Number.isFinite(score) ? Math.min(score, 1) : 0;
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

        // Scoring products
        const scored = products.map((p) => {
            const matchedTags = p.tags.filter((tag) =>
                vaultTags.includes(tag)
            );

            const score = calculateScore(p, vaultTags, userProfileAI);

            return {
                productId: p.id,
                name: p.name,
                score,
                reason: matchedTags.length
                    ? `Matched: ${matchedTags.join(", ")}`
                    : "Based on trends",
            };
        });

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