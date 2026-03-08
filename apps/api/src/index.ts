import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { errorHandler } from "./middlewares/error.middleware";
import "dotenv/config";
import { HEALTH_ENDPOINT } from "@securevault/constants";

import { authRouter } from "./routes/auth.routes";
import { vaultRouter } from "./routes/vault.routes";
import { deviceRouter } from "./routes/device.routes";
import { rateLimiter } from "./middlewares/rate-limiter.middleware";
import { successResponse } from "./utils/helper/response";

export const app = new Hono();

const EXPECTED_ORIGIN = process.env.EXPECTED_ORIGIN || "http://localhost:3000";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [EXPECTED_ORIGIN];

// Global Middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow mobile apps / curl / postman
      if (!origin) return "*";

      if (
        process.env.NODE_ENV === "development" ||
        ALLOWED_ORIGINS.includes(origin)
      ) {
        return origin;
      }

      return ALLOWED_ORIGINS[0];
    },
    credentials: true,
  }),
);

app.use("/api/*", rateLimiter);
app.onError(errorHandler);

// Health Check
app.get(HEALTH_ENDPOINT.GET_STATUS, (c) =>
  successResponse(c, { status: 200, data: { jservice: "SecureVault X" } }),
);

// Mount Domains
app.route("/", authRouter);
app.route("/", vaultRouter);
app.route("/", deviceRouter);
app.get("/", (c) => {
  return c.redirect(
    process.env.WEBSITE_BASE_URL || "https://securevaultx.com",
    302,
  );
});

// Start Server
const port = 3000;
if (process.env.NODE_ENV !== "test") {
  console.log(`Server starting on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}
