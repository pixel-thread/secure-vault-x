import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("BL-001: Logic & Flow Abuse (OWASP API6:2023 Unrestricted Access to Sensitive Business Flows)", () => {
  it("should safely handle malformed or logically impossible flows natively", async () => {
     const res = await app.request("/api/device/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Hacked Device" }) // Missing publicKey, hardwareId, etc.
     });
     // Request validation via zod must catch it
     expect(res.status).toBe(400); 
  });
});
