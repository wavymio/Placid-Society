const { createClient } = require('redis')

const redis = createClient({ url: process.env.REDIS_CONNECTION_STRING })
redis.on("error", (err) => console.log("Redis client error", err))

const connectToRedis = async () => {
    try {
        await redis.connect()
        console.log("✅ Redis connected")
    } catch (err) {
        console.error("❌ Redis connection failed", err)
        process.exit(1)
    }
}

module.exports = { connectToRedis, redis }