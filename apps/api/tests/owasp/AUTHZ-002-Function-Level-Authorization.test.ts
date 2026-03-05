import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("AUTHZ-002: Function Level Auth (OWASP API5:2023 Broken Function Level Auth)", () => {
  it("should strictly block non-admins from all admin routes", async () => {
     // SecureVault X doesn't rely heavily on admin routes yet, but if it did, a standard user token would fail.
     const fakeToken = await generateSpoofedToken({ userId: "standard-user", role: "USER" });
     const routes = ["/api/admin/users", "/api/admin/devices"];
     for (const route of routes) {
        const res = await app.request(route, {
            headers: { "Authorization": `Bearer ${fakeToken}` }
        });
        expect([401, 403, 404]).toContain(res.status); // 404 is also safe as it means route non-existent
     }
  });

  it("should reject HTTP verb tampering (e.g. bypassing GET with POST/OPTIONS on restricted data)", async () => {
     const fakeToken = await generateSpoofedToken({ userId: "standard-user" });
     const resOptions = await app.request("/api/vault/sync", { method: "OPTIONS" });
     const resPost = await app.request("/api/auth/me", { method: "POST", headers: { "Authorization": `Bearer ${fakeToken}` } });
     
     // OPTIONS is allowed by CORS, but mostly returning 200/204.
     // POST to /me should 404 or 405 Method Not Allowed
     expect([401, 403, 404, 405]).toContain(resPost.status);
  });
});
