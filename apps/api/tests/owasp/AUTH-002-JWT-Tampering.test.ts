import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("AUTH-002: JWT Tampering (OWASP API2:2023 Broken Authentication)", () => {
  const TARGET_ENDPOINT = "/api/auth/me";

  it("should reject tampered token signatures instantly", async () => {
    const fakeToken = await generateSpoofedToken({ userId: "123" }, new TextEncoder().encode("wrong_secret_key"));
    const res = await app.request(TARGET_ENDPOINT, {
        headers: { "Authorization": `Bearer ${fakeToken}` }
    });
    expect([401, 403]).toContain(res.status);
  });

  it("should mitigate 'alg: none' vulnerability", async () => {
     // using our helper that forces local generation if jose complains about "none"
     const fakeToken = await generateSpoofedToken({ userId: "123" }, undefined, "none");
     const res = await app.request(TARGET_ENDPOINT, {
        headers: { "Authorization": `Bearer ${fakeToken}` }
     });
     expect([401, 403]).toContain(res.status);
  });
  
  it("should safely reject entirely malformed (e.g. non-JWT) tokens", async () => {
     const res = await app.request(TARGET_ENDPOINT, {
        headers: { "Authorization": `Bearer definitely-not-a-jwt` }
     });
     expect([401, 403]).toContain(res.status);
  });
});
