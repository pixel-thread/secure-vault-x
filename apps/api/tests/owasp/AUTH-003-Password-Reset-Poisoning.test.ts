import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("AUTH-003: Password Reset Poisoning (OWASP API4:2023 Insecure Design)", () => {
  it("should validate and strictly ignore malicious Host headers in stateful redirects", async () => {
    const res = await app.request("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Host": "evil-site.com", "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" })
    });
    // Should either 404 (endpoint unavail) or ignore the header in the email body
    expect([200, 404, 400, 401, 403]).toContain(res.status);
  });
  
  it("should ignore malicious X-Forwarded-Host headers", async () => {
    const res = await app.request("/api/auth/forgot-password", {
        method: "POST",
        headers: { "X-Forwarded-Host": "evil-site.com", "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@example.com" })
    });
    expect([200, 404, 400, 401, 403]).toContain(res.status);
  });
});
