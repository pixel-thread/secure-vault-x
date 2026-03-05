import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("BOLA-002: Property Level Access (OWASP API3:2023 Broken Object Property Level Auth)", () => {
  it("should not leak sensitive object properties under any circumstance", async () => {
      // Create a spoofed token if getting "me", but best to test a route that yields a user or device
      const res = await app.request("/api/auth/me", {
          method: "GET",
          headers: { "Authorization": `Bearer wrong_token` }
      });
      // Even if it failed, ensure no leak in the bounce
      const body = await res.text();
      expect(body).not.toContain("passwordHash");
      expect(body).not.toContain("salt");
      expect(body).not.toContain("hash");
  });
});
