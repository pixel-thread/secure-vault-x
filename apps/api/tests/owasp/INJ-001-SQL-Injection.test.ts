import { describe, it, expect } from "vitest";
import { app } from "../../src/index";
import { generateSpoofedToken } from "../helpers";

describe("INJ-001: SQL Injection (OWASP API8:2023 Security Misconfig / API3:2023)", () => {
  const payloads = [
    "' OR '1'='1",
    "admin'--",
    "'; DROP TABLE User;--",
    "' UNION SELECT null, hashPassword FROM Auth--",
    "'; SELECT pg_sleep(5)--"
  ];
    
  it("should actively immunize inputs against widespread SQLi attack vectors natively via Prisma", async () => {
    for (const email of payloads) {
        const res = await app.request("/api/auth/password/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: "p" })
        });
        expect([400, 401, 403]).toContain(res.status); // 400 validation or 401 unauthorized
    }
  });
});
