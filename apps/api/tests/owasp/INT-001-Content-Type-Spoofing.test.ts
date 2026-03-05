import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("INT-001: Unsafe Deserialization & Content-Type Spoofing (OWASP A08)", () => {
  it("should actively drop malformed payloads avoiding native JS deserialization faults natively", async () => {
      const res = await app.request("/api/auth/password/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "<xml><email>test@example.com</email></xml>"
      });
      expect(res.status).toBe(400); // Json parser rejects raw XML smoothly
  });
});
