import { Context, Next } from "hono";
import { sendResponse } from "../utils/helper/response";
import { redis } from "../services/redis.service";

const RATE_LIMIT_PREFIX = "rl:";
const MAX_REQUESTS = 20; // Increased slightly for production
const WINDOW_SEC = 60; // 1 minute

export const rateLimiter = async (c: Context, next: Next) => {
  // In production, you would trust 'x-forwarded-for' ONLY if behind a trusted proxy.
  // For standard Node server, remoteAddress is safer.
  const ip =
    c.req.header("cf-connecting-ip") || // Cloudflare
    c.req.header("x-real-ip") ||
    // c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";

  const key = `${RATE_LIMIT_PREFIX}${ip}`;

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, WINDOW_SEC);
    }

    const ttl = await redis.ttl(key);

    c.header("X-RateLimit-Limit", MAX_REQUESTS.toString());
    c.header(
      "X-RateLimit-Remaining",
      Math.max(0, MAX_REQUESTS - count).toString(),
    );
    c.header(
      "X-RateLimit-Reset",
      (Math.floor(Date.now() / 1000) + ttl).toString(),
    );

    if (count > MAX_REQUESTS) {
      c.header("Retry-After", ttl.toString());
      return sendResponse(c, {
        success: false,
        status: 429,
        message: "Too Many Requests. Please try again later.",
      });
    }
  } catch (error) {
    console.error("[RateLimiter] Redis error:", error);
    // Fallback: allow request if Redis is down (fail-open for UX, or fail-closed for security)
  }

  await next();
};
