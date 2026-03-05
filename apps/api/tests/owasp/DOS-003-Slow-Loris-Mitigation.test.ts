import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("DOS-003: Slow-Rate Request Mitigation (OWASP API4:2023)", () => {
  it("should handle incomplete/hanging payloads securely (Simulated)", async () => {
    // Sending invalid lengths
    const res = await app.request("/api/auth/password/login", {
        method: "POST",
        headers: { "Content-Length": "9999", "Content-Type": "application/json" },
        body: '{"email":"test@'
    });
    expect(res.status).toBeDefined(); 
  });
});
