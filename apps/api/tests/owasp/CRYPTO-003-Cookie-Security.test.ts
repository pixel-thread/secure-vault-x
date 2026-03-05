import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("CRYPTO-003: Cookie Security Enforcement (Api-Guardian)", () => {
  it("should enforce HttpOnly, Secure, and SameSite flags on any issued cookies (if used)", async () => {
      const res = await app.request("/api/auth/password/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "target@example.com", password: "p" })
      });
      const cookieHeader = res.headers.get('set-cookie');
      if (cookieHeader) {
          expect(cookieHeader.toLowerCase()).toContain("httponly");
          if (process.env.NODE_ENV === "production") expect(cookieHeader.toLowerCase()).toContain("secure");
          expect(cookieHeader.toLowerCase()).toContain("samesite");
      }
  });
});
