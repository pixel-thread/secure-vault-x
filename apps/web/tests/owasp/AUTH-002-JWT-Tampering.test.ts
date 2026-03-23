import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("AUTH-002: JWT Tampering (OWASP API2:2023 Broken Authentication)", () => {
  const TARGET_ENDPOINT = "/auth/me";

  it("should reject tampered token signatures", async () => {
    const res = await request(baseUrl)
      .get(TARGET_ENDPOINT)
      .set("Authorization", "Bearer invalid.token.signature");
    expect([401, 403, 429]).toContain(res.status);
  });

  it("should mitigate 'alg: none' vulnerability", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "none", typ: "JWT" }),
    ).toString("base64");
    const payload = Buffer.from(JSON.stringify({ userId: "123" })).toString(
      "base64",
    );
    const fakeToken = `${header}.${payload}.`;
    const res = await request(baseUrl)
      .get(TARGET_ENDPOINT)
      .set("Authorization", `Bearer ${fakeToken}`);
    expect([401, 403, 429]).toContain(res.status);
  });
});
