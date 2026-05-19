const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
        reconnectStrategy(retries) {
            return Math.min(retries * 100, 3000);
        },
    },
});

redisClient.on("connect", () => {
    console.log("Redis connecting...");
});

redisClient.on("ready", () => {
    console.log("Redis ready");
});

redisClient.on("error", (err) => {
    console.error("Redis Error:", err.message);
});

redisClient.on("reconnecting", () => {
    console.log("Redis reconnecting...");
});

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error("Redis connection failed", err.message);
    }
})();

module.exports = redisClient;