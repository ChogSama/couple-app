const eventBus = require("../eventBus");
const EVENT_TYPES = require("../eventTypes");

eventBus.on(
    EVENT_TYPES.RECOMMENDATION_GENERATED,
    async ({ payload }) => {
        try {
            console.log(
                "[QUEUE] Recommendation generated",
                payload.userId
            );

            // future:
            // - async ranking
            // - restraining AI
            // - recommendation snapshots
            // - vector embedding update

        } catch (err) {
            console.error(
                "[QUEUE] Recommendation error",
                err.message
            );
        }
    }
);