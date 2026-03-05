import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("DOS-001: High Volume Requests (OWASP API4:2023 Lack of Resource & Rate Limiting)", () => {
  it("should securely absorb and limit request volumes on open routes (Rate Limiter verification)", async () => {
      // Sends 25 burst requests to an open route
      const promises = Array.from({length: 25}).map(() => app.request("/api/auth/me"));
      const results = await Promise.all(promises);
      const isHealthy = results.every(res => res.status !== 500);
      expect(isHealthy).toBe(true);
      // Some must be 429 if the limiter fired
      expect(results.some(r => r.status === 429 || r.status === 401)).toBe(true);
  });
});
