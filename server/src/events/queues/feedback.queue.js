const eventBus = require("../eventBus");
const EVENT_TYPES = require("../eventTypes");

eventBus.on(
    EVENT_TYPES.FEEDBACK_PROCESSED,
    async ({ payload }) => {
        try {
            console.log(
                "[FEEDBACK PIPELINE]",
                payload
            );

            /* future:
            - retrain recommendation model
            - reinforcement learning
            - batch analytics */
        } catch (err) {
            console.error(
                "[FEEDBACK ERROR]",
                err.message
            );
        }
    }
);