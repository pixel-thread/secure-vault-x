import { Context, Next } from "hono";
import { sendResponse } from "../utils/helper/response";

const RATE_LIMIT_PREFIX = "rl:";
const MAX_REQUESTS = 20;
const WINDOW_MS = 60 * 1000; // 1 minute

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

export const rateLimiter = async (c: Context, next: Next) => {
  const ip =
    c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || "unknown";

  const key = `${RATE_LIMIT_PREFIX}${ip}`;
  const now = Date.now();

  // Prevent map from growing indefinitely
  if (rateLimitStore.size >= 50) {
    rateLimitStore.clear();
  }

  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };
  } else {
    entry.count += 1;
  }

  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, MAX_REQUESTS - entry.count);
  const ttl = Math.ceil((entry.resetTime - now) / 1000);

  c.header("X-RateLimit-Limit", MAX_REQUESTS.toString());
  c.header("X-RateLimit-Remaining", remaining.toString());
  c.header("X-RateLimit-Reset", Math.floor(entry.resetTime / 1000).toString());

  if (entry.count > MAX_REQUESTS) {
    c.header("Retry-After", ttl.toString());

    return sendResponse(c, {
      success: false,
      status: 429,
      message: "Too Many Requests. Please try again later.",
    });
  }

  await next();
};
