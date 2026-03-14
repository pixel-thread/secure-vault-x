import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("A07: MFA & Session Integrity", () => {
  it("should reject MFA verification with expired or invalid codes", async () => {
    const res = await request(baseUrl)
      .post("/auth/mfa/verify")
      .send({ code: "000000" });
    expect([400, 401, 403, 429]).toContain(res.status);
  });

  it("should prevent sensitive operations without a verified session", async () => {
    const res = await request(baseUrl).get("/vault");
    expect([401, 429]).toContain(res.status);
  });
});
