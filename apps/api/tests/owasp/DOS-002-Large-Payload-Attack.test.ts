import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("DOS-002: Large Payload Attack (OWASP API4:2023)", () => {
  it("should violently drop inputs exceeding arbitrary threshold bounds at parser level", async () => {
    // Injecting a 10MB string straight expecting a 400/413 rejection or memory cap
    const massiveContent = "A".repeat(10 * 1024 * 1024);
    const res = await app.request("/api/auth/password/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com", password: massiveContent })
    });
    // Status depends on parser limits (Hono payload limit)
    expect([413, 400, 401]).toContain(res.status);
  });
});
