# Feature PRD: Account Password Management

## Overview

Allows authenticated users to set, update, or remove a traditional password for account access. This feature is strictly for **API-level authentication** and does not impact vault encryption or the primary WebAuthn security model.

---

## User Requirements

### Change Password

- Accessible via **Security Settings** screen.
- Requires a **Current Password** field for identity verification.
- Requires **OTP (2FA)** confirmation via the existing MFA page flow.
- Password is updated **only when both the current password and MFA OTP are verified successfully**.

### Verification Flow

1. User navigates to Security Settings → Change Password.
2. User enters their **current password** (if one is set).
3. User enters a **new password** and **confirm new password**.
4. User completes **MFA/OTP verification** (reuses the existing MFA screen).
5. Backend validates both factors before applying the change.

### Security Constraints

- Passwords must be **hashed server-side** using Argon2 or Bcrypt.
- Plaintext passwords must **never** be stored or logged.
- Password change should optionally **invalidate other active sessions** (security hardening).

---

## Implementation Plan

### Phase A: Backend API (Next.js + PostgreSQL)

#### A1 — Database Migration

- Add a **nullable `password_hash`** column to the `users` table.
- Migration must be backward-compatible (existing users without a password are unaffected).

#### A2 — API Endpoint: `POST /auth/password/change-password`

| Step | Action                                            |
| ---- | ------------------------------------------------- |
| 1    | Validate session via Access Token                 |
| 2    | Verify current password against stored hash       |
| 3    | Verify 2FA OTP                                    |
| 4    | Hash new password with Argon2 / Bcrypt            |
| 5    | Update `password_hash` in the database            |
| 6    | _(Optional)_ Invalidate all other active sessions |

**Request Body:**

```json
{
  "current_password": "string",
  "new_password": "string",
  "otp": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password updated successfully."
}
```

**Error Cases:**

- `401` — Invalid current password
- `403` — Invalid or expired OTP
- `422` — New password does not meet strength requirements
- `429` — Rate limit exceeded

---

### Phase B: Mobile UI (Expo React Native)

#### B1 — Security Settings Screen

A new `ChangePasswordScreen` component within the Security Settings section:

- **Current Password** field (hidden if no password is set)
- **New Password** field with real-time strength indicator
- **Confirm New Password** field with match validation
- A **"Continue"** CTA that triggers the MFA flow before submission

#### B2 — Form Validation Rules

| Field            | Rule                                                    |
| ---------------- | ------------------------------------------------------- |
| Current Password | Required if password is already set                     |
| New Password     | Min 12 chars, uppercase, lowercase, digit, special char |
| Confirm Password | Must match New Password exactly                         |
| OTP              | 6-digit numeric, validated on backend                   |

#### B3 — MFA Integration

- On "Continue", navigate to the **existing MFA/OTP screen**.
- Pass a `context: "change_password"` flag so the screen knows to return control to the password change flow after verification.
- Only call `POST /auth/password/change-password` after OTP is collected.

#### B4 — API Integration

- Use the secure service layer (no direct fetch calls from UI).
- Handle all error states gracefully with user-facing messages.
- Show a success confirmation and navigate back to Security Settings on completion.

---

## Execution Workflow

### 1. Code Review (`code-reviewer.md`)

Before merging backend changes, verify:

- **Hashing Integrity:** Argon2 or Bcrypt used with appropriate salt/cost factors; no MD5/SHA-1.
- **Input Sanitization:** All inputs validated and parameterized to prevent SQL injection.
- **WebAuthn Consistency:** Adding a password does not bypass or weaken the primary WebAuthn security model.
- **Rate Limiting:** Endpoint is rate-limited to prevent brute-force attacks.

### 2. Refactoring (`refactor-cleaner.md`)

- **Auth Middleware:** Centralize password verification logic shared between login and password-change flows.
- **DTOs:** Standardize request/response shapes for all authentication-related endpoints.
- **Error Handling:** Use a consistent error response schema across all auth endpoints.

### 3. Finalization (`simplified.md`)

Produce a `simplified.md` containing:

- Final, clean API controller code (Nextjs handler for `change-password`)
- Optimized `ChangePasswordScreen` React Native component
- Summary of security decisions made during implementation

---

## Acceptance Criteria

- [ ] `password_hash` column added to `users` table via migration.
- [ ] `POST /auth/password/change-password` rejects requests with invalid session, wrong current password, or invalid OTP.
- [ ] New passwords are hashed with Argon2 or Bcrypt before storage.
- [ ] Plaintext passwords never appear in logs or API responses.
- [ ] Mobile UI enforces password strength rules before submission.
- [ ] MFA screen is reused and returns correctly to the password change flow.
- [ ] Success and error states are handled with appropriate UI feedback.
- [ ] _(Optional)_ Other active sessions are invalidated after a successful password change.

---

## Out of Scope

- Vault encryption key management (separate concern).
- Password reset via email/SMS (separate "Forgot Password" feature).
- Admin-initiated password resets.
