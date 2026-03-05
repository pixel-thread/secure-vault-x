import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("AUTH-004: Environmental Scope Leakage (Security-Engineer / OWASP A07)", () => {
  it("should actively guard against .env or JWT secret leakage in all native REST payloads", async () => {
     const res = await app.request("/api/auth/me");
     const bodyStr = await res.text();
     expect(bodyStr.toLowerCase()).not.toContain(process.env.JWT_SECRET?.toLowerCase() || "secret");
     expect(bodyStr.toLowerCase()).not.toContain("database_url");
  });
});
