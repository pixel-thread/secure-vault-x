import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("BL-003: Business Logic Insecure Direct Object Reference (Security-Engineer)", () => {
  it("should rigorously block logic allowing users to trust/update devices belonging to others natively", async () => {
      const fakeToken = await generateSpoofedToken({ userId: "standard-user" });
      const res = await app.request("/api/device/123-other-users-device/trust", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${fakeToken}` },
          body: JSON.stringify({ isTrusted: true })
      });
      // BOLA/IDOR protection requires device ownership validation
      expect([401, 403, 404]).toContain(res.status); 
  });
});
