import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("AUTH-001: Brute Force Protection (OWASP API2:2023 & API4:2023)", () => {
  const TARGET_ENDPOINT = "/auth/password/login";

  it("should enforce rate limiting after repeated login attempts", async () => {
    const targetEmail = `bruteforce-target-${Date.now()}@example.com`;
    const wrongPassword = "IncorrectPassword123!";
    for (let i = 1; i <= 6; i++) {
        const res = await request(baseUrl)
          .post(TARGET_ENDPOINT)
          .set("x-test-limit", "5")
          .send({ email: targetEmail, password: wrongPassword });
        if (i <= 5) expect([401, 429]).toContain(res.status);
        else expect(res.status).toBe(429);
    }
  });

  it("should mitigate brute force enumeration via standardized response times", async () => {
    const startInvalid = Date.now();
    await request(baseUrl).post(TARGET_ENDPOINT).send({ email: `non-existent-${Date.now()}@example.com`, password: "p" });
    const durationInvalid = Date.now() - startInvalid;

    const startValid = Date.now();
    await request(baseUrl).post(TARGET_ENDPOINT).send({ email: "testuser@example.com", password: "wrong" });
    const durationValid = Date.now() - startValid;

    expect(Math.abs(durationValid - durationInvalid)).toBeLessThan(500); 
  });
});
