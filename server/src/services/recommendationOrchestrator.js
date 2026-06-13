const { getGiftRecommendations } = require("./recommendService");
const recommendationQueue = require("../events/queues/recommendation.queue");
const analyticsQueue = require("../events/queues/analytics.queue");
const EVENT_TYPES = require("../events/eventTypes");
const { emitEvent } = require("../events/eventEmitter");

async function generateRecommendations(userId, options = {}) {
    const recommendations =
        await getGiftRecommendations(userId, options);

    emitEvent(
        EVENT_TYPES.RECOMMENDATION_GENERATED,
        {
            userId,
            count: recommendations.results.length,
        }
    );

    return recommendations;
}

async function refreshRecommendations(userId) {
    emitEvent(
        EVENT_TYPES.RECOMMENDATION_GENERATED,
        {
            userId,
        }
    );

    return {
        queued: true,
    };
}

module.exports = {
    generateRecommendations,
    refreshRecommendations,
};