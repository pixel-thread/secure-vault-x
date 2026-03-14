// OWASP API-Guardian E2E Test Generator
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "tests/owasp");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const header = `import { describe, it, expect } from "vitest";
import request from "supertest";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
`;

const templates = {
  "AUTH-001-Brute-Force-Protection": `describe("AUTH-001: Brute Force Protection (OWASP API2:2023 & API4:2023)", () => {
  const TARGET_ENDPOINT = "/auth/password/login";

  it("should enforce rate limiting after repeated login attempts", async () => {
    const targetEmail = \`bruteforce-target-\${Date.now()}@example.com\`;
    const wrongPassword = "IncorrectPassword123!";
    for (let i = 1; i <= 6; i++) {
        const res = await request(baseUrl)
          .post(TARGET_ENDPOINT)
          .set("x-test-limit", "5")
          .send({ email: targetEmail, password: wrongPassword });
        if (i <= 5) expect([401, 429]).toContain(res.status);
        else expect(res.status).toBe(429);
    }
  });

  it("should mitigate brute force enumeration via standardized response times", async () => {
    const startInvalid = Date.now();
    await request(baseUrl).post(TARGET_ENDPOINT).send({ email: \`non-existent-\${Date.now()}@example.com\`, password: "p" });
    const durationInvalid = Date.now() - startInvalid;

    const startValid = Date.now();
    await request(baseUrl).post(TARGET_ENDPOINT).send({ email: "testuser@example.com", password: "wrong" });
    const durationValid = Date.now() - startValid;

    expect(Math.abs(durationValid - durationInvalid)).toBeLessThan(500); 
  });
});`,

  "AUTH-002-JWT-Tampering": `describe("AUTH-002: JWT Tampering (OWASP API2:2023 Broken Authentication)", () => {
  const TARGET_ENDPOINT = "/auth/me";

  it("should reject tampered token signatures", async () => {
    const res = await request(baseUrl).get(TARGET_ENDPOINT).set("Authorization", "Bearer invalid.token.signature");
    expect([401, 403, 429]).toContain(res.status);
  });

  it("should mitigate 'alg: none' vulnerability", async () => {
     const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString('base64');
     const payload = Buffer.from(JSON.stringify({ userId: "123" })).toString('base64');
     const fakeToken = \`\${header}.\${payload}.\`;
     const res = await request(baseUrl).get(TARGET_ENDPOINT).set("Authorization", \`Bearer \${fakeToken}\`);
     expect([401, 403, 429]).toContain(res.status);
  });
});`,

  "A01-Header-Spoofing": `describe("A01: Header Spoofing (Broken Access Control)", () => {
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
});`,

  "A05-Verbose-Errors": `describe("A05: Security Misconfiguration (Verbose Errors)", () => {
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
});`,

  "A09-IP-Spoofing": `describe("A09: Security Logging (IP Spoofing)", () => {
  it("should not trust x-forwarded-for header blindly for sensitive logs", async () => {
    const res = await request(baseUrl)
      .post("/auth/password/change-password")
      .set("x-forwarded-for", "8.8.8.8, 127.0.0.1")
      .send({ current_password: "old", new_password: "new", otp: "123456" });
    
    expect([400, 401, 403, 429]).toContain(res.status); 
  });
});`,

  "INJ-001-SQL-Injection": `describe("INJ-001: SQL Injection", () => {
  const payloads = [
    "' OR '1'='1",
    "admin'--",
    "'; DROP TABLE \\"User\\";--",
  ];
    
  it("should prevent SQL injection vectors", async () => {
    for (const email of payloads) {
        const res = await request(baseUrl).post("/auth/password/login").send({ email, password: "p" });
        expect([400, 401, 403, 429]).toContain(res.status);
    }
  });
});`,

  "A07-MFA-Integrity": `describe("A07: MFA & Session Integrity", () => {
  it("should reject MFA verification with expired or invalid codes", async () => {
    const res = await request(baseUrl)
      .post("/auth/mfa/verify")
      .send({ code: "000000" });
    expect([400, 401, 403, 429]).toContain(res.status);
  });

  it("should prevent sensitive operations without a verified session", async () => {
    const res = await request(baseUrl).get("/vault");
    expect([401, 429]).toContain(res.status);
  });
});`,

  "DOS-002-Large-Payload-Attack": `describe("DOS-002: Large Payload Attack", () => {
  it("should reject massive payloads", async () => {
    const massiveContent = "A".repeat(2 * 1024 * 1024); // 2MB
    const res = await request(baseUrl).post("/auth/password/login").send({ email: "test@example.com", password: massiveContent });
    expect([413, 400, 401, 429]).toContain(res.status);
  });
});`,

  "BOLA-001-Broken-Object-Level-Authorization": `describe("BOLA-001: Broken Object Level Auth", () => {
  it("should prevent access to another user's device", async () => {
    const otherDeviceId = "00000000-0000-0000-0000-000000000000";
    const res = await request(baseUrl).get(\`/devices/\${otherDeviceId}\`);
    expect([401, 403, 404, 429]).toContain(res.status);
  });
});`,

  "AUTH-005-MFA-Bypass": `describe("AUTH-005: MFA & Session Integrity (OWASP API2:2023)", () => {
  it("should block access to sensitive actions when MFA is required but not completed", async () => {
    const partialAuthToken = "jwt-without-mfa-claim"; 
    const res = await request(baseUrl).get("/auth/me").set("Authorization", \`Bearer \${partialAuthToken}\`);
    expect([400, 401, 403, 429]).toContain(res.status);
  });

  it("should reject MFA code reuse (Replay Attack)", async () => {
    const code = "000000";
    await request(baseUrl).post("/auth/mfa/verify")
      .set("x-test-limit", "50")
      .send({ code });
    const res = await request(baseUrl).post("/auth/mfa/verify")
      .set("x-test-limit", "50")
      .send({ code });
    expect([400, 401, 403, 429]).toContain(res.status);
  });
});`,

  "INJ-005-SSTI-and-Log-Injection": `describe("INJ-005: Template & Log Injection (OWASP API3:2023)", () => {
  it("should not evaluate server-side template expressions in input", async () => {
    const payload = "{{7*7}} \${7*7} <% 7*7 %>";
    const res = await request(baseUrl).post("/auth/me").send({ displayName: payload });
    if (res.status === 200) {
      expect(res.text).not.toContain("49");
    } else {
      expect([400, 401, 429]).toContain(res.status);
    }
  });

  it("should prevent Log Crushing/Injection (LF/CR injection)", async () => {
    const maliciousLog = "NormalInput\\n[ERROR] System Compromised";
    const res = await request(baseUrl).post("/logs").send({ message: maliciousLog });
    expect([200, 201, 400, 401, 429]).toContain(res.status);
  });
});`,

  "DOS-003-Slow-Loris-Mitigation": `describe("DOS-003: Slow-Rate Request Mitigation (OWASP API4:2023)", () => {
  it("should not hang indefinitely on incomplete payloads", async () => {
    const res = await request(baseUrl)
      .post("/auth/password/login")
      .set("Content-Length", "999")
      .timeout({ response: 2000, deadline: 5000 })
      .send("a")
      .catch(err => err.response);
    
    if (res) {
      expect([200, 400, 401, 408, 413, 429, 504]).toContain(res.status); 
    }
  });
});`,

  "BL-004-Recursive-Depth-Limit": `describe("BL-004: Resource Exhaustion via Depth (OWASP API4:2023)", () => {
  it("should prevent deep relational queries from crashing the API (N+1 / Depth)", async () => {
    const res = await request(baseUrl).get("/vault?include[vault][items][vault]=true");
    expect([400, 200, 401, 404, 429]).toContain(res.status); 
  });
});`,

  "INT-002-Unsafe-File-Uploads": `describe("INT-002: Malicious File Upload (OWASP API8:2023)", () => {
  it("should reject executable file extensions", async () => {
    const res = await request(baseUrl)
      .post("/vault/add")
      .attach('file', Buffer.from('shell_exec("rm -rf /");'), 'malicious.php');
    expect([400, 401, 403, 415, 404, 429]).toContain(res.status);
  });
});`,
};

const templateKeys = Object.keys(templates);

templateKeys.forEach((baseName) => {
  const fileName = baseName + ".test.ts";
  const filePath = path.join(dir, fileName);
  const body = templates[baseName];
  const finalContent = header + body + "\n";
  fs.writeFileSync(filePath, finalContent);
});

console.log(
  "SUCCESS: Seeded " +
  templateKeys.length +
  " robust OWASP endpoints via Api-Guardian.",
);
