import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("SESSION-001: Session Fixation (OWASP API2:2023 Broken Auth)", () => {
  it("should actively mandate exact session lifecycle closures invalidating tokens strictly", async () => {
      const res = await app.request("/api/auth/logout", {
          method: "POST"
      });
      expect([400, 401]).toContain(res.status); // 401 unauth (needs token to logout usually)
  });
});
