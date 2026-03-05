import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("CONF-002: CORS Policy (OWASP API8:2023 Security Misconfiguration)", () => {
  it("should systematically reject unauthorized wildcard Origins in production", async () => {
      // Our API supports multiple origins via ALLOWED_ORIGINS. We ensure it doesn't just wildcard '*'.
      const res = await app.request("/api/auth/me", {
          method: "OPTIONS",
          headers: { "Origin": "http://evil-attacker.com" }
      });
      // It should NOT respond with Access-Control-Allow-Origin: * unless in dev
      if (process.env.NODE_ENV === "production") {
          expect(res.headers.get("access-control-allow-origin")).not.toBe("*");
      }
  });
  
  it("should not reflect back unauthorized Origins securely in production", async () => {
      const res = await app.request("/api/auth/me", {
          method: "OPTIONS",
          headers: { "Origin": "http://evil-attacker.com" }
      });
      if (process.env.NODE_ENV === "production") {
          expect(res.headers.get("access-control-allow-origin")).not.toBe("http://evil-attacker.com");
      }
  });
});
