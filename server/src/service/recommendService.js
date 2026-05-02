const prisma = require("../lib/prisma");
const { getVaultScore, getAIScore, safe } = require("../utils/scoring");

// NOTE: Optimize: Batch queries instead of await in loop
// Get behavior score based on past interactions
async function getBehaviorMap(userId) {
    const logs = await prisma.recommendationLog.findMany({
        where: { userId },
    });

    const map = {};

    for (const l of logs) {
        if (!map[l.productId]) map[l.productId] = { click: 0, purchase: 0 };

        if (l.isClicked) map[l.productId].click += 0.2;
        if (l.isPurchased) map[l.productId].purchase += 0.5;
    }

    return map;
}

// Get trending score based on overall popularity
async function getTrendingMap() {
    const logs = await prisma.recommendationLog.groupBy({
        by: ["productId"],
        _count: { productId: true },
        where: { isClicked: true },
    });

    const map = {};

    for (const l of logs) {
        map[l.productId] = Math.min(l._count.productId / 50, 1);
    }

    return map;
}

// Get gift recommendations
async function getGiftRecommendations(userId) {
    // Partner
    const rel = await prisma.relationship.findFirst({
        where: {
            status: "CONNECTED",
            OR: [{ user1Id: userId }, { user2Id: userId }],
        },
    });

    if (!rel) throw new Error("NO_PARTNER");

    const partnerId =
        rel.user1Id === userId ? rel.user2Id : rel.user1Id;


    // Vault
    const vaultItems = await prisma.secretVault.findMany({
        where: {
            ownerId: partnerId,
            isVisibleToPartner: true,
        },
    });

    const vaultTags = [
        ...new Set(
            vaultItems.flatMap((v) =>
                v.content.toLowerCase().split(/[\s,]+/)
            )
        ),
    ];

    // AI
    const profile = await prisma.userProfileAI.findUnique({
        where: { userId },
    });

    const aiTags = profile?.tags || [];

    // Merge tags
    const combined = [...new Set([...vaultTags, ...aiTags])];

    // Product
    let products = [];

    if (combined.length) {
        products = await prisma.product.findMany({
            where: {
                tags: {
                    hasSome: combined,
                },
            },
            take: 20,
        });
    }

    // Fallback to popular products if no matches
    if (!products.length) {
        products = await prisma.product.findMany({
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
        });
    }

    // Batch scores
    const behaviorMap = await getBehaviorMap(userId);
    const trendingMap = await getTrendingMap();

    const scored = products.map((p) => {
        const vault = getVaultScore(p, vaultTags);
        const ai = getAIScore(p, profile);
        const behavior = behaviorMap[p.id]?.click + behaviorMap[p.id]?.purchase || 0;
        const trend = trendingMap[p.id] || 0;   

        const score = safe(
                0.4 * vault +
                0.3 * ai +
                0.2 * behavior +
                0.1 * trend
            );

        return {
            productId: p.id,
            name: p.name,
            score,
        };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return {
        results: scored.slice(0, 10),
        context: { vaultTags, aiTags },
    };
}

module.exports = { getGiftRecommendations };