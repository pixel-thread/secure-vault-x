import { Hono } from "hono";
import { test, expect, describe, beforeAll, afterAll } from "vitest"; // Use vitest
// In a real environment, you'd use 'supertest' or `app.request` natively supported by Hono.
import { authRouter } from "../routes/auth.routes";
import { vaultRouter } from "../routes/vault.routes";
import { errorHandler } from "../middlewares/error.middleware";

import { app } from "../index";

describe("API Security Tests (OWASP Top 10)", () => {

 describe("A01: Broken Access Control", () => {
  test("GET /api/auth/me should fail without token", async () => {
   const res = await app.request("/api/auth/me");
   expect(res.status).toBe(401);
   const data = (await res.json()) as any;
   expect(data.success).toBe(false);
   expect(data.message).toBe("Unauthorized");
  });

  test("GET /api/vault should fail without token", async () => {
   const res = await app.request("/api/vault");
   expect(res.status).toBe(401);
  });
 });

 describe("A05: Security Misconfiguration (Error Handling)", () => {
  test("POST to invalid route should return 404 cleanly", async () => {
   const res = await app.request("/api/non-existent");
   expect(res.status).toBe(404);
  });

  test("Invalid JSON payload should be handled nicely", async () => {
   const res = await app.request("/api/auth/password/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ bad json",
   });
   expect(res.status).toBe(400);
  });
 });

 describe("A07: Identification and Authentication Failures", () => {
  test("POST /api/auth/password/login should require strong payload limits", async () => {
   const res = await app.request("/api/auth/password/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "" })
   });
   expect(res.status).toBe(400);
   const data = (await res.json()) as any;
   expect(data.success).toBe(false);
   expect(data.message).toBe("Request validation failed");
  });
 });

});
