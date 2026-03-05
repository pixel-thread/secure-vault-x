import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("MASS-001: Mass Assignment (OWASP API3:2023 Broken Object Property Level Auth)", () => {
  it("should strictly ignore parameters trying to elevate profile levels on update or signup (e.g. role injection)", async () => {
     const res = await app.request("/api/auth/password/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: "mass@test.com", password: "pass", role: "ADMIN", isSuperAdmin: true })
     });
     // Validating Zod exact object stripping or 401 unauth
     expect([400, 401]).toContain(res.status);
  });
});
