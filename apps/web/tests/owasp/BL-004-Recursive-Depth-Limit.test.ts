import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("BL-004: Resource Exhaustion via Depth (OWASP API4:2023)", () => {
  it("should prevent deep relational queries from crashing the API (N+1 / Depth)", async () => {
    const res = await request(baseUrl).get(
      "/vault?include[vault][items][vault]=true",
    );
    expect([400, 200, 401, 404, 429]).toContain(res.status);
  });
});
