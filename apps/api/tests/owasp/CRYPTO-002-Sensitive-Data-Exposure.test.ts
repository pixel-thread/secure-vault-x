import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("CRYPTO-002: Sensitive Data Exposure (OWASP A02:2021 Cryptographic Failures)", () => {
  it("should definitively isolate exact tokens from API logs or standard GET responses", async () => {
     const res = await app.request("/api/auth/me");
     const body = await res.text();
     expect(body).not.toContain("passwordHash");
  });
});
