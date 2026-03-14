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

describe("Devices Functional Tests", () => {
  const testUserId = "00000000-0000-0000-0000-000000000001";
  const testSessionId = "00000000-0000-0000-0000-000000000002";

  it("should list all devices for the user", async () => {
    const token = await generateTestToken(testUserId, testSessionId);
    const res = await request(baseUrl)
      .get("/devices")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should fail to register a device without valid data", async () => {
    const token = await generateTestToken(testUserId, testSessionId);
    const res = await request(baseUrl)
      .post("/devices")
      .set("Authorization", `Bearer ${token}`)
      .send({ deviceName: "" }); // Empty name is invalid

    expect(res.status).toBe(400); // Missing publicKey etc.
  });
});
