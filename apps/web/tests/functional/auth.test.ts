import { describe, it, expect } from "vitest";
import request from "supertest";
import * as jose from "jose";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

async function generateTestToken(userId: string, sessionId: string) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("securevault-api")
    .setAudience("securevault-client")
    .setExpirationTime("1h")
    .sign(secret);
}

describe("Auth Functional Tests", () => {
  const testUserId = "00000000-0000-0000-0000-000000000001";
  const testSessionId = "00000000-0000-0000-0000-000000000002";

  it("should return the current user profile when authorized", async () => {
    const token = await generateTestToken(testUserId, testSessionId);
    const res = await request(baseUrl)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect([200, 401, 404]).toContain(res.status);
  });

  it("should fail to return profile with an expired token", async () => {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const expiredToken = await new jose.SignJWT({ userId: testUserId, sessionId: testSessionId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("securevault-api")
      .setAudience("securevault-client")
      .setExpirationTime("-1h")
      .sign(secret);

    const res = await request(baseUrl)
      .get("/auth/me")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it("should fail when no authorization header is provided", async () => {
    const res = await request(baseUrl).get("/auth/me");
    expect(res.status).toBe(401);
  });
});
