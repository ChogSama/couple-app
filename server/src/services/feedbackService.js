const redis = require("../lib/redis");
const { updateFromBehavior } = require("./aiProfileService");
const { storeProductEmbedding } = require("./embeddingService");
const EVENT_TYPES = require("../events/eventTypes");
const { emitEvent } = require("../events/eventEmitter");

async function clearRecommendationCache(userId) {
    const keys = await redis.keys(`recommend:user:${userId}:*`);

    if (keys.length) {
        await redis.del(keys);
    }
}

async function processFeedback({
    userId,
    product,
    feedbackType,
}) {
    const weight =
        feedbackType === "PURCHASE" ? 0.3 : 0.1;

    await updateFromBehavior(userId, product, weight);

    await clearRecommendationCache(userId);

    if (product?.id) {
        await storeProductEmbedding(
            product.id,
            `${product.name} ${product.category} ${product.tags?.join(" ")}`
        );
    }

    emitEvent(
        EVENT_TYPES.FEEDBACK_PROCESSED,
        {
            userId,
            productId: product.id,
            feedbackType,
        }
    );
}

module.exports = {
    processFeedback,
};