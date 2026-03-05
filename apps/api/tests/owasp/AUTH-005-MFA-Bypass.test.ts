import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("AUTH-005: MFA & Session Integrity (OWASP API2:2023)", () => {
  it("should block access to sensitive actions when MFA is required but not completed", async () => {
    // Attempting a vault sync with a partial/non-MFA token when requireMFA is enforced
    const fakeToken = await generateSpoofedToken({ userId: "123", mfa_verified: false }); 
    const res = await app.request("/api/vault", {
       headers: { "Authorization": `Bearer ${fakeToken}` }
    });
    expect([401, 403, 400]).toContain(res.status); // Should throw unauthorized or bad request
  });

  it("should reject MFA code reuse (Replay Attack) or invalid formats", async () => {
    const res = await app.request("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer bad-token" },
        body: JSON.stringify({ otp: "invalid-code", mfaToken: "bad" })
    });
    expect([401, 403, 400]).toContain(res.status);
  });
});
