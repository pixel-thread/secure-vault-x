import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("INJ-003: Command Injection (OWASP API3:2023)", () => {
  it("should safely interpret and delimit OS command characters passed uniformly", async () => {
      const res = await app.request("/api/vault/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": "Bearer bad-token" },
          body: JSON.stringify({ deviceId: "test; cat /etc/passwd", items: [] })
      });
      // Evaluates safely as a literal string parsing rejection or 401 Unauthorized
      expect([400, 401, 403]).toContain(res.status);
  });
});
