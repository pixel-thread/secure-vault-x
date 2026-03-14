import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("BOLA-001: Broken Object Level Auth", () => {
  it("should prevent access to another user's device", async () => {
    const otherDeviceId = "00000000-0000-0000-0000-000000000000";
    const res = await request(baseUrl).get(`/devices/${otherDeviceId}`);
    expect([401, 403, 404, 429]).toContain(res.status);
  });
});
