const eventBus = require("../eventBus");
const EVENT_TYPES = require("../eventTypes");

eventBus.on(
    EVENT_TYPES.NOTIFICATION_SEND,
    async ({ payload }) => {
        try {
            console.log(
                "[NOTIFICATION]",
                payload
            );

            // future:
            // email
            // push notification
            // websocket realtime

        } catch (err) {
            console.error(err.message);
        }
    }
);