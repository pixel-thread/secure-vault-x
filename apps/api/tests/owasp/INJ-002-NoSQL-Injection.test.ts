import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("INJ-002: NoSQL/Object Injection (OWASP API3:2023 Injection)", () => {
  it("should strictly type-enforce payload properties dropping Object bypass payloads via Zod", async () => {
      const res = await app.request("/api/auth/password/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: { "$ne": null }, password: "p" })
      });
      expect([400, 401]).toContain(res.status); // 400 from Zod validation
  });
});
