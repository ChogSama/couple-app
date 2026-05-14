const prisma = require("../lib/prisma");
const redis = require("../lib/redis");
const { buildExplainabilityPayload } = require("../utils/explainability");
const { getVaultScore, getAIScore, safe } = require("../utils/scoring");
const { calculateVendorScore } = require("../utils/vendorScoring");

let trendingCache = null;
let lastTrendingFetch = 0;

const STOP_WORDS = ["i", "and", "or", "the", "a", "love", "like", "likes"];

function normalize(tag) {
    return tag.toLowerCase().trim();
}

function buildExplanation({
    vaultScore,
    aiScore,
    behaviorScore,
    trendingScore,
    matchedTags,
    vendorScore,
}) {
    const reasons = [];

    if (vaultScore > 0) {
        reasons.push({
            type: "VAULT",
            message: matchedTags.length
                ? `You liked ${matchedTags.join(", ")}`
                : "Matches your preferences",
            score: Number(vaultScore.toFixed(2)),
        });
    }

    if (aiScore > 0) {
        reasons.push({
            type: "AI",
            message: "AI preference match",
            score: Number(aiScore.toFixed(2)),
        });
    } 

    if (behaviorScore > 0) {
        reasons.push({
            type: "BEHAVIOR",
            message: "Based on past clicks/purchases",
            score: Number(behaviorScore.toFixed(2)),
        });
    }

    if (trendingScore > 0) {
        reasons.push({
            type: "TRENDING",
            message: "Popular among users",
            score: Number(trendingScore.toFixed(2)),
        });
    }

    if (vaultScore === 0 && aiScore === 0) {
        reasons.push({
            type: "SURPRISE",
            message: "Something new for you",
            score: 0.3,
        });
    }

    if (vendorScore > 0.7) {
        reasons.push({
            type: "VENDOR",
            message: "Trusted high-quality vendor",
            score: Number(vendorScore.toFixed(2)),
        });
    }

    return reasons;
}

function getDominantSource(explanation) {
    if (!explanation.length) return "TRENDING";

    const sorted = [...explanation].sort((a, b) => b.score - a.score);
    return sorted[0].type;
}

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

async function getTrendingMapCached() {
    const cacheKey = "recommend:trending-map";

    // Redis cache
    const cached = await redis.get(cacheKey);

    if (cached) {
        return JSON.parse(cached);
    }

    // Memory fallback
    const now = Date.now();

    if (trendingCache && now - lastTrendingFetch < 60000) {
        return trendingCache;
    }

    // DB fetch
    const map = await getTrendingMap();

    trendingCache = map;
    lastTrendingFetch = now;

    // Save redis cache for 60s
    await redis.set(cacheKey, JSON.stringify(map), {
        EX: 60,
    });

    return map;
}

async function getSurpriseProducts(existingIds, limit = 3) {
    return prisma.product.findMany({
        where: {
            id: { notIn: existingIds },
        },
        orderBy: {
            createdAt: "desc",
        },
        take: limit,
    });
}

async function getCachedRecommendations(userId, options) {
    const cacheKey =
        `recommend:user:${userId}:` +
        JSON.stringify(options || {});

    const cached = await redis.get(cacheKey);

    if (!cached) return null;

    return JSON.parse(cached);
}

async function setCachedRecommendations(userId, options, data) {
    const cacheKey =
        `recommend:user:${userId}:` +
        JSON.stringify(options || {});

    await redis.set(cacheKey, JSON.stringify(data), {
        EX: 120,
    });
}

// Get gift recommendations
async function getGiftRecommendations(userId, options = {}) {
    const { surprise = false, surpriseRatio = 0.2 } = options;

    const cached = await getCachedRecommendations(
        userId,
        options
    );

    if (cached) {
        return cached;
    }

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
                v.content
                    .toLowerCase()
                    .split(/[\s,]+/)
                    .map(normalize)
                    .filter((t) => t && !STOP_WORDS.includes(t))
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
            include: {
                vendor: true,
            },
            take: 20,
        });
    }

    // Fallback to popular products if no matches
    if (!products.length) {
        products = await prisma.product.findMany({
            include: {
                vendor: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
        });
    }

    let finalProducts = [...products];
    
    if (surprise) {
        const surpriseCount = Math.max(
            1,
            Math.floor(products.length * surpriseRatio)
        );

        const surpriseItems = await getSurpriseProducts(
            products.map((p) => p.id),
            surpriseCount
        );

        finalProducts = [...products, ...surpriseItems];
    }

    // Batch scores
    const behaviorMap = await getBehaviorMap(userId);
    const trendingMap = await getTrendingMapCached();

    const scored = finalProducts.map((p) => {
        const vault = getVaultScore(p, vaultTags);
        const ai = getAIScore(p, profile);

        const behaviorData = behaviorMap[p.id] || { click: 0, purchase: 0 };

        const behavior =
            Math.min(
                (behaviorData.click || 0) +
                (behaviorData.purchase || 0),
                1
            );

        const trend = trendingMap[p.id] || 0;
        
        const vendorScore =
            calculateVendorScore(p.vendor);

        const score = safe(
                0.35 * vault +
                0.25 * ai +
                0.15 * behavior +
                0.1 * trend +
                0.15 * vendorScore
            );

        const matchedTags = p.tags.filter((tag) =>
            vaultTags.includes(tag)
        );

        const explanation = buildExplanation({
            vaultScore: vault,
            aiScore: ai,
            behaviorScore: behavior,
            trendingScore: trend,
            matchedTags
        });

        const primaryReason =
            explanation.sort((a, b) => b.score - a.score)[0];

        const dominantSource = getDominantSource(explanation);

        const explainability = buildExplainabilityPayload({
            product: p,
            score,
            explanation,
            source: dominantSource,
        });

        const vendorIntelligence = {
            vendorId: p.vendor.id,
            vendorName: p.vendor.name,
            vendorScore,
        };

        return {
            productId: p.id,
            name: p.name,
            score,
            reason: explanation,
            primaryReason: primaryReason?.message || "Recommended for you",
            source: dominantSource,
            explainability,
            vendorIntelligence,
        };
    });

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    const response = {
        results: scored.slice(0, 10),
        context: { vaultTags, aiTags },
    };

    await setCachedRecommendations(
        userId,
        options,
        response
    );

    return response;
}

module.exports = { getGiftRecommendations };