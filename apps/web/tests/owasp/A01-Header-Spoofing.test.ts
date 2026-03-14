import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("A01: Header Spoofing (Broken Access Control)", () => {
  it("should ignore x-user-id header provided by the client", async () => {
    const res = await request(baseUrl)
      .get("/vault")
      .set("x-user-id", "unauthorized-uuid-123");
    
    expect([401, 429]).toContain(res.status);
  });

  it("should ignore x-session-id header provided by the client", async () => {
    const res = await request(baseUrl)
      .get("/vault")
      .set("x-session-id", "malicious-session-id");
    
    expect([401, 429]).toContain(res.status);
  });
});
