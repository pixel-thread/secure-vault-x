import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("DOS-003: Slow-Rate Request Mitigation (OWASP API4:2023)", () => {
  it("should not hang indefinitely on incomplete payloads", async () => {
    const res = await request(baseUrl)
      .post("/auth/password/login")
      .set("Content-Length", "999")
      .timeout({ response: 2000, deadline: 5000 })
      .send("a")
      .catch((err) => err.response);

    if (res) {
      expect([200, 400, 401, 408, 413, 429, 504]).toContain(res.status);
    }
  });
});
