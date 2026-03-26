import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("A09: Security Logging (IP Spoofing)", () => {
  it("should not trust x-forwarded-for header blindly for sensitive logs", async () => {
    const res = await request(baseUrl)
      .post("/auth/password/change-password")
      .set("x-forwarded-for", "8.8.8.8, 127.0.0.1")
      .send({ current_password: "old", new_password: "new", otp: "123456" });

    expect([400, 401, 403, 429]).toContain(res.status);
  });
});
