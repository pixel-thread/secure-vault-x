import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./middlewares/error.middleware";
import { rateLimiter } from "./middlewares/rate-limiter.middleware";
import "dotenv/config";
import { HEALTH_ENDPOINT } from "@securevault/constants";

import { authRouter } from "./routes/auth.routes";
import { vaultRouter } from "./routes/vault.routes";
import { deviceRouter } from "./routes/device.routes";

export const app = new Hono();

const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN || "http://localhost:3000";

// Global Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", cors({ origin: EXPECTED_ORIGIN, credentials: true }));
app.use("/api/*", rateLimiter);
app.onError(errorHandler);

// Health Check
app.get(HEALTH_ENDPOINT.GET_STATUS, (c) =>
  c.json({ status: "ok", service: "SecureVault X API" }),
);

// Mount Domains
app.route("/", authRouter);
app.route("/", vaultRouter);
app.route("/", deviceRouter);

// Start Server
const port = 3000;
console.log(`Server starting on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
