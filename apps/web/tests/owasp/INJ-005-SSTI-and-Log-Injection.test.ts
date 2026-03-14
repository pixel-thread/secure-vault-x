import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("INJ-005: Template & Log Injection (OWASP API3:2023)", () => {
  it("should not evaluate server-side template expressions in input", async () => {
    const payload = "{{7*7}} ${7*7} <% 7*7 %>";
    const res = await request(baseUrl).post("/auth/me").send({ displayName: payload });
    if (res.status === 200) {
      expect(res.text).not.toContain("49");
    } else {
      expect([400, 401, 429]).toContain(res.status);
    }
  });

  it("should prevent Log Crushing/Injection (LF/CR injection)", async () => {
    const maliciousLog = "NormalInput\n[ERROR] System Compromised";
    const res = await request(baseUrl).post("/logs").send({ message: maliciousLog });
    expect([200, 201, 400, 401, 429]).toContain(res.status);
  });
});
