---
title: Task Skill Rule - Cybersecurity Auditor PRD
description: Product Requirements Document for the Node.js/Next.js + Prisma Cybersecurity Auditor Skill
---

# Task Skill Rule: Cybersecurity Auditor & Penetration Tester -- PRD

## 1. Skill Overview

**Name:** Cybersecurity Auditor (Node.js/Next.js & Prisma)  
**Category:** AI Agent Skill / Security Testing Persona  
**Platform:** Next.js, TypeScript, Prisma ORM  

The Cybersecurity Auditor is an AI agent skill rule designed to perform deep-dive security audits on provided API routes. It strictly enforces the OWASP Top 10 (2021) guidelines and modern API security best practices to identify and remediate vulnerabilities in Next.js and Prisma-based backends.

---

## 2. Vision

To enforce a secure-by-default development lifecycle where all API routes and business logic are proactively audited and hardened before deployment. By automating the identification of modern API security pitfalls, this skill aims to eliminate critical vulnerabilities (like IDOR, Injection, and Broken Auth) turning vulnerable code into production-ready, bulletproof APIs.

---

## 3. Goals & Objectives

### Primary Goals
-   Perform deep-dive security audits of provided Next.js API routes and server actions.
-   Identify vulnerabilities squarely aligned with the OWASP Top 10 (2021).
-   Provide actionable, type-safe Next.js/TypeScript code remediations utilizing **Zod** (for validation) and **Prisma** (for secure data access).
-   Generate a structured, professional "Security Audit Report".

### Non-Goals
-   Auditing unrelated tech stacks (e.g., Python/Django or raw SQL databases without Prisma).
-   Deploying or configuring infrastructure features (WAFs, cloud IAM).

---

## 4. Target Users

-   **AI Coding Assistants:** Using this rule to guide the evaluation of user-provided code.
-   **Developers / Engineers:** Reviewing the output to implement security patches.
-   **Security Teams:** Reviewing documented remediation strategies.

---

## 5. Core Features / Audit Scope

The skill must deeply scan code for the following OWASP Top 10 categories:

### 5.1 Broken Access Control (A01)
-   Missing RBAC/ABAC enforcement.
-   IDOR (Insecure Direct Object Reference) in Prisma `where` clauses.

### 5.2 Cryptographic Failures (A02)
-   Hardcoded/plaintext sensitive data.
-   Weak hashing algorithms.
-   Missing SSL/TLS pinning logic.

### 5.3 Injection (A03)
-   Raw SQL queries (`Prisma.$queryRaw`) with un-sanitized inputs.

### 5.4 Insecure Design (A04)
-   Deep business logic flaws (e.g., allowing a standard user to elevate privileges or tamper with other users' critical records).

### 5.5 Security Misconfiguration (A05)
-   Stack traces or verbose error messages leaked in production.
-   Missing security headers (CORS, Helmet).

### 5.6 Vulnerable Components (A06)
-   Outdated security patterns or unsafe middleware usage.

### 5.7 Identification & Auth Failures (A07)
-   Weak JWT validation, session fixation, or improper token storage.

### 5.8 Software & Data Integrity Failures (A08)
-   Unsigned payloads or unsafe deserialization of user input.

### 5.9 Security Logging & Monitoring Failures (A09)
-   Lack of audit logs for highly sensitive operations (e.g., password resets, financial changes).

### 5.10 Server-Side Request Forgery - SSRF (A10)
-   Unvalidated user-supplied URLs passed to `fetch` or Axios.

---

## 6. Functional Requirements (Execution Task)

When invoked, the skill must execute the following structured workflow for **every** route or file provided:

1.  **Identify the Risk:** Explicitly name the corresponding OWASP category.
2.  **Technical Breakdown:** Provide a precise, technical explanation of exactly how an attacker could exploit the provided code.
3.  **Severity Rating:** Assign a rating of **Critical, High, Medium, or Low**.
4.  **Remediation Code:** Supply the comprehensive, fixed TypeScript/Next.js code snippet ensuring the use of **Zod** for input validation and **Prisma** for secure database interaction.

---

## 7. Non-Functional Requirements

### Output Formatting
-   The final output **must** be formatted as a structured "Security Audit Report".
-   Markdown tables and code blocks must be used for readability.

### Remediation Quality
-   Remedial code must be syntactically valid TypeScript.
-   Remedial code must reflect modern Next.js patterns (App Router / Pages Router as appropriate based on input).

---

## 8. Security & Threat Model Summary

**Threats Mitigated:**
-   Unauthorized data access (IDOR).
-   SQL Injection via improper ORM usage.
-   Account takeover due to flawed JWT implementation.
-   Sensitive data exposure via verbose error handling.

**Residual Risks:**
-   Vulnerabilities deeply embedded in third-party NPM packages out of the scanner's direct file scope.
-   Misconfigured cloud environments (e.g., exposed Vercel environment variables).

---

## 9. Development / Execution Phases

-   **Phase 1 - Parsing:** Ingest and parse Next.js API routes and Prisma schema definitions.
-   **Phase 2 - Scanning:** Compare logic against the defined OWASP Top 10 parameters constraints.
-   **Phase 3 - Exploitation Mapping:** Draft technical breakdown of the exploit mechanism.
-   **Phase 4 - Hardening:** Generate Zod schemas and rewrite Prisma queries.
-   **Phase 5 - Reporting:** Assemble and format the final Security Audit Report.

---

## 10. KPIs & Success Metrics

-   **Vulnerability Detection:** > 95% identification rate for top-tier risks (Injection, Broken Auth).
-   **Remediation Accuracy:** 100% of provided code patches compile without type errors.
-   **Actionability:** 0% hallucinated vulnerabilities (findings strictly based on provided code).

---

## 11. Future Roadmap

-   Support for other ORMs (Drizzle, TypeORM).
-   Automated generation of boundary testing files (e.g., Jest/Vitest test cases proving the vulnerability and the fix).
-   Integration with CI/CD pipeline prompts as an automated PR reviewer.

---

## 12. Conclusion

The Task Skill Rule for the Cybersecurity Auditor ensures a rigorous, zero-trust approach to API development. By systematically applying this skill to Next.js and Prisma codebases, engineering teams can identify code-level vulnerabilities early and rely on robust, actionable remediation strategies.
