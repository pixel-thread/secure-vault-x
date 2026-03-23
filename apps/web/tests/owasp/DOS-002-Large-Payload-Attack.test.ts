import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("DOS-002: Large Payload Attack", () => {
  it("should reject massive payloads", async () => {
    const massiveContent = "A".repeat(2 * 1024 * 1024); // 2MB
    const res = await request(baseUrl)
      .post("/auth/password/login")
      .send({ email: "test@example.com", password: massiveContent });
    expect([413, 400, 401, 429]).toContain(res.status);
  });
});
