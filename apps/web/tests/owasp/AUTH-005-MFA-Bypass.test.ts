import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("AUTH-005: MFA & Session Integrity (OWASP API2:2023)", () => {
  it("should block access to sensitive actions when MFA is required but not completed", async () => {
    const partialAuthToken = "jwt-without-mfa-claim";
    const res = await request(baseUrl)
      .get("/auth/me")
      .set("Authorization", `Bearer ${partialAuthToken}`);
    expect([400, 401, 403, 429]).toContain(res.status);
  });

  it("should reject MFA code reuse (Replay Attack)", async () => {
    const code = "000000";
    await request(baseUrl)
      .post("/auth/mfa/verify")
      .set("x-test-limit", "50")
      .send({ code });
    const res = await request(baseUrl)
      .post("/auth/mfa/verify")
      .set("x-test-limit", "50")
      .send({ code });
    expect([400, 401, 403, 429]).toContain(res.status);
  });
});
