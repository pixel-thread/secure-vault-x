import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("CONF-001: Debug Mode Exposure (OWASP API8:2023 Security Misconfiguration)", () => {
  it("should safely mask server stack traces on predictable 500/error triggers", async () => {
     // A deliberately empty body without headers can sometimes force a stack trace if unguarded
     const res = await app.request("/api/auth/password/login", { method: "POST" });
     
     // Validating that Zod/Hono catches it and raw errors aren't dumped
     const body = await res.text();
     expect(body).not.toContain("Error:");
     expect(body).not.toContain("node_modules");
     expect(body).not.toContain("PrismaClientKnownRequestError");
  });
});
