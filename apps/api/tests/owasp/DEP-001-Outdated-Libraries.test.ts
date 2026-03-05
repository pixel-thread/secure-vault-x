import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("DEP-001: Outdated Libraries (OWASP A06:2021 Vulnerable and Outdated Components)", () => {
  it("should not utilize known vulnerable parsing techniques natively (Prototype Poisoning)", async () => {
      const payload = { "toString": "exploit" };
      const res = await app.request("/api/auth/password/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
      });
      expect([400, 401]).toContain(res.status); // Zod blocks prototype poisoning
  });
});
