const eventBus = require("./eventBus");

function emitEvent(type, payload = {}) {
    eventBus.emit(type, {
        timestamp: new Date().toISOString(),
        payload,
    });
}

module.exports = {
    emitEvent,
};