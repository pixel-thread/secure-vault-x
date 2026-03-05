import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("INJ-004: XSS in API Output (OWASP API3:2023)", () => {
  it("should neutralize active Script execution attempts dynamically in inputs", async () => {
     const res = await app.request("/api/auth/password/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: "<script>alert('XSS')</script>", password: "p" })
     });
     expect([400, 401]).toContain(res.status);
  });
  
  it("should enforce strict MIME types in API returns preventing script rendering", async () => {
     const res = await app.request("/api/auth/me");
     expect(res.headers.get("content-type")).toContain("application/json"); 
  });
});
