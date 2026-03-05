import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("META-001: Info Leakage via Headers (OWASP API8:2023 Security Misconfiguration)", () => {
  it("should not leak specific architecture headers publicly", async () => {
      const res = await app.request("/api/auth/me");
      expect(res.headers.get("x-powered-by")).toBeNull(); // Hono secureHeaders strips or replaces this
  });
});
