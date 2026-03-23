import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("INJ-001: SQL Injection", () => {
  const payloads = ["' OR '1'='1", "admin'--", '\'; DROP TABLE "User";--'];

  it("should prevent SQL injection vectors", async () => {
    for (const email of payloads) {
      const res = await request(baseUrl)
        .post("/auth/password/login")
        .send({ email, password: "p" });
      expect([400, 401, 403, 429]).toContain(res.status);
    }
  });
});
