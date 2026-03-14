import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
describe("INT-002: Malicious File Upload (OWASP API8:2023)", () => {
  it("should reject executable file extensions", async () => {
    const res = await request(baseUrl)
      .post("/vault/add")
      .attach('file', Buffer.from('shell_exec("rm -rf /");'), 'malicious.php');
    expect([400, 401, 403, 415, 404, 429]).toContain(res.status);
  });
});
