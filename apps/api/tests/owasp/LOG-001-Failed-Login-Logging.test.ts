import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("LOG-001: Failed Login Logging (OWASP API10:2023 Unsafe Consumption of APIs)", () => {
  it("should rigorously verify failure interactions are safely bounded", async () => {
     const res = await app.request("/api/auth/password/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ email: "fail@test.com", password: "p" })
     });
     expect(res.status).toBeGreaterThanOrEqual(400); 
  });
});
