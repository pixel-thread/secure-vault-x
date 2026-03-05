import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("INV-001: Deprecated API Versions (OWASP API9:2023 Improper Inventory Management)", () => {
  it("should securely gate unmanaged legacy paths (simulated)", async () => {
      const res = await app.request("/api/v1/users");
      expect([404, 401, 403]).toContain(res.status);
  });
});
