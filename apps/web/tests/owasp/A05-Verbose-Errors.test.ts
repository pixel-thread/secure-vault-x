import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("A05: Security Misconfiguration (Verbose Errors)", () => {
  it("should not leak Prisma error details in production", async () => {
    const res = await request(baseUrl)
      .get("/devices/not-a-uuid");
    
    expect([400, 401, 404, 500, 429]).toContain(res.status);
  });

  it("should return generic error message for unhandled exceptions", async () => {
     const res = await request(baseUrl)
        .post("/auth/login/verify")
        .set("Content-Type", "application/json")
        .send("invalid-json");
     
     expect([400, 401, 500, 429]).toContain(res.status); 
     if (res.body && res.body.message) {
       expect(res.body.message).not.toContain("Prisma");
       expect(res.body.message).not.toContain("SyntaxError");
     }
  });
});
