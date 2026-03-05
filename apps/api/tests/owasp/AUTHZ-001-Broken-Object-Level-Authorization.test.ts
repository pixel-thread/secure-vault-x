import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("AUTHZ-001/BOLA-001: Broken Object Level Auth (OWASP API1:2023 BOLA)", () => {
  it("should block unauthenticated modification of arbitrary objects", async () => {
    const res = await app.request("/api/vault/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "123-fake", encryptedMEK: "x", lastSync: 0, items: [] })
    });
    // Vault requires auth
    expect([401, 403]).toContain(res.status);
  });
  
  it("should block unassociated users from viewing private vault objects", async () => {
    // Generate a token for a random non-existent user
    const fakeToken = await generateSpoofedToken({ userId: "malicious-user-id" });
    const res = await app.request("/api/vault", {
        method: "GET",
        headers: { "Authorization": `Bearer ${fakeToken}` }
    });
    // Vault lookup checks the userId validity or fails
    expect([401, 403, 404]).toContain(res.status);
  });
});
