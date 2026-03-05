import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
 maxRetriesPerRequest: 3,
 retryStrategy: (times) => {
  const delay = Math.min(times * 50, 2000);
  return delay;
 },
});

redis.on("error", (error) => {
 console.error("[Redis] Client error:", error);
});

redis.on("connect", () => {
 if (process.env.NODE_ENV !== "production") {
  console.log("[Redis] Connected successfully");
 }
});
