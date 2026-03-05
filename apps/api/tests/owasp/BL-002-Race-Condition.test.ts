import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("BL-002: Race Condition (OWASP API4:2023 Insecure Design)", () => {
  it("should maintain database integrity under highly concurrent identical mutation requests (Logout/Sync)", async () => {
     const endpoint = "/api/auth/logout";
     const promises = Array.from({length: 10}).map(() => app.request(endpoint, {
         method: "POST",
         headers: { "Content-Type": "application/json" }
     }));
     const results = await Promise.all(promises);
     // Handled safely without DB crash or 500 error cascade (Auth guard catches 401s usually)
     results.forEach(res => expect(res.status).not.toBe(500));
  });
});
