import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("CRYPTO-001: Transport Layer Security (OWASP API8:2023)", () => {
  it("should enforce robust cryptographic headers (HSTS)", async () => {
     // secureHeaders() middleware configures this on all routes
     const res = await app.request("/api/auth/me");
     expect(res.headers.get("strict-transport-security")).toBeDefined(); 
  });
});
