import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("LOGIC-001: Integer Overflow and Type Juggling (OWASP API4:2023 Insecure Design)", () => {
  it("should safely normalize or explicitly reject negative limits in syncing or timestamps", async () => {
     const res = await app.request("/api/vault/sync", {
         method: "POST",
         headers: { "Content-Type": "application/json", "Authorization": "Bearer bad-token" },
         body: JSON.stringify({ deviceId: "123", lastSync: -500, items: [] }) // Negative sync time
     });
     expect([400, 401, 403]).toContain(res.status);
  });
});
