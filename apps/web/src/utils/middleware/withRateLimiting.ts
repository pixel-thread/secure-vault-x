import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { MiddlewareFactory } from "./stackMiddleware";

const isProd = process.env.NODE_ENV === "production";

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

if (
  isProd &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
  });
}

// In-memory store for local development/testing to save Upstash limits
const localStore = new Map<string, { count: number; reset: number }>();

const checkRateLimit = async (ip: string, request: NextRequest) => {
  if (isProd && ratelimit) {
    return await ratelimit.limit(ip);
  }

  // Local Development Simulation (Configurable Threshold)
  const now = Date.now();
  const windowMs = process.env.RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
    : 10000;

  // Allow test override via header in non-prod
  const manualLimit = request.headers.get("x-test-limit");
  const limit =
    !isProd && manualLimit
      ? parseInt(manualLimit)
      : process.env.RATE_LIMIT_THRESHOLD
        ? parseInt(process.env.RATE_LIMIT_THRESHOLD)
        : 100;

  let record = localStore.get(ip);
  if (!record || now > record.reset) {
    record = { count: 0, reset: now + windowMs };
  }

  record.count += 1;
  localStore.set(ip, record);

  return {
    success: record.count <= limit,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.reset,
  };
};

export const withRateLimiting: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next) => {
    // Skip rate limiting for static files and non-API routes
    if (!request.nextUrl.pathname.startsWith("/api/")) {
      return await next(request, _next);
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIpHeader = request.headers.get("x-real-ip");

    const clientIp =
      (forwardedFor ? forwardedFor.split(",")[0]?.trim() : null) ||
      realIpHeader ||
      "127.0.0.1";

    if (forwardedFor && realIpHeader) {
      const spoofedIp = forwardedFor.split(",")[0]?.trim();
      if (spoofedIp !== realIpHeader && realIpHeader !== "127.0.0.1") {
        console.warn(
          `[RATE-LIMIT] IP Spoofing Anomaly: X-Forwarded-For (${spoofedIp}) does not match X-Real-IP (${realIpHeader})`,
        );
      }
    }

    const result = await checkRateLimit(clientIp, request);

    if (!result.success) {
      console.warn(`[RATE-LIMIT] Threshold exceeded for IP: ${clientIp}`);

      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(result.limit),
            "X-RateLimit-Remaining": String(result.remaining),
            "X-RateLimit-Reset": String(result.reset),
            "Retry-After": String(
              Math.ceil((result.reset - Date.now()) / 1000) > 0
                ? Math.ceil((result.reset - Date.now()) / 1000)
                : 10,
            ),
          },
        },
      );
    }

    const response = await next(request, _next);

    if (response) {
      response.headers.set("X-RateLimit-Limit", String(result.limit));
      response.headers.set("X-RateLimit-Remaining", String(result.remaining));
      response.headers.set("X-RateLimit-Reset", String(result.reset));
    }

    return response;
  };
};
