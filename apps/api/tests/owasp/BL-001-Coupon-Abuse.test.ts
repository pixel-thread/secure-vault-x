import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("BL-001: Logic & Flow Abuse (OWASP API6:2023 Unrestricted Access to Sensitive Business Flows)", () => {
  it("should safely handle malformed or logically impossible flows natively", async () => {
     const res = await app.request("/api/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacked Device" }) // Missing publicKey, hardwareId, etc.
     });
     // Request validation via zod must catch it or auth rejects it beforehand
     expect([400, 401, 403]).toContain(res.status); 
  });
});
