import { Context, Next } from "hono";
import { sendResponse } from "../utils/helper/response";

// A simple in-memory rate limiter using a Map
// Structure: Map<IP_Address, { count: number, resetTime: number }>
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const MAX_REQUESTS = 10; // Max requests per window
const WINDOW_MS = 60 * 1000; // 1 minute window

export const rateLimiter = async (c: Context, next: Next) => {
  const ip =
    c.req.header("x-forwarded-for") ||
    c.env?.incoming?.socket?.remoteAddress ||
    "unknown";

  const currentTime = Date.now();
  const record = rateLimitMap.get(ip);

  if (record) {
    if (currentTime > record.resetTime) {
      // Reset window
      rateLimitMap.set(ip, { count: 1, resetTime: currentTime + WINDOW_MS });
    } else {
      if (record.count >= MAX_REQUESTS) {
        c.header(
          "Retry-After",
          Math.ceil((record.resetTime - currentTime) / 1000).toString(),
        );
        return sendResponse(c, {
          success: false,
          status: 429,
          message: "Too Many Requests. Please try again later.",
        });
      }
      record.count += 1;
      rateLimitMap.set(ip, record);
    }
  } else {
    // New IP
    rateLimitMap.set(ip, { count: 1, resetTime: currentTime + WINDOW_MS });
  }

  // Set standard Rate Limit Headers
  const currentRecord = rateLimitMap.get(ip)!;
  c.header("X-RateLimit-Limit", MAX_REQUESTS.toString());
  c.header(
    "X-RateLimit-Remaining",
    Math.max(0, MAX_REQUESTS - currentRecord.count).toString(),
  );
  c.header(
    "X-RateLimit-Reset",
    Math.ceil(currentRecord.resetTime / 1000).toString(),
  );

  await next();

  // Basic cleanup mechanism (naive sweep to prevent memory leak)
  if (rateLimitMap.size > 10000) rateLimitMap.clear();
};
