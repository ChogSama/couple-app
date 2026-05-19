const eventBus = require("../eventBus");
const EVENT_TYPES = require("../eventTypes");

eventBus.on(
    EVENT_TYPES.RECOMMENDATION_CLICKED,
    async ({ payload }) => {
        console.log(
            "[ANALYTICS] Click tracked",
            payload
        );
    }
);

eventBus.on(
    EVENT_TYPES.RECOMMENDATION_PURCHASED,
    async ({ payload }) => {
        console.log(
            "[ANALYTICS] Purchase tracked",
            payload,
        );
    }
);