# SecureVault X – Architecture Documentation

## 1. Overview

SecureVault X is a zero-knowledge, end-to-end encrypted password manager built using a TypeScript monorepo architecture.

It provides:

- Passwordless authentication (WebAuthn)
- End-to-end encrypted vault storage
- Secure Enclave / Keystore–protected key hierarchy
- Offline-first mobile architecture
- Multi-device encrypted synchronization
- Two-Factor Authentication (email OTP)
- Trusted Device Management
- Refresh token rotation with reuse detection

The backend must never be capable of decrypting vault data.

---

# 2. Monorepo Structure

The system uses PNPM Workspaces or Turborepo.

```

securevault-x/  
├── apps/  
│ ├── api/ # Hono backend  
│ ├── mobile/ # Expo React Native app  
│  
├── packages/  
│ ├── crypto/ # Shared encryption logic  
│ ├── types/ # Shared TypeScript types  
│ ├── config/ # Shared TS + ESLint configs  
│  
├── prisma/  
├── docker/  
├── docs/  
└── README.md

```

---

# 3. Technology Stack

## Backend
- Node.js
- TypeScript
- Hono
- PostgreSQL
- Prisma ORM
- jose (JWT)
- WebAuthn server library

## Mobile
- Expo (React Native)
- TypeScript
- expo-secure-store
- expo-local-authentication
- SQLite or MMKV
- Web Crypto polyfill

---

# 4. System Architecture

## 4.1 Zero-Knowledge Design

- Vault encryption happens client-side only.
- Master Encryption Key (MEK) is generated on the device.
- Server stores only encrypted vault blobs.
- Encryption keys never leave the client unencrypted.
- Backend cannot decrypt vault contents even with full DB access.

---

# 5. Cryptographic Architecture

## 5.1 Key Hierarchy

Master Encryption Key (MEK)
↓
Vault encrypted with AES-256-GCM

MEK is encrypted using:

Device Key Encryption Key (DKEK)

DKEK is stored in:
- iOS Secure Enclave
- Android Keystore

---

## 5.2 Encryption Standards

### Vault Encryption
- AES-256-GCM
- 12-byte random IV
- 128-bit authentication tag
- IV never reused

### Key Derivation
- Argon2id
- Randomly generated 16-byte salt (stored in UserEncryption model)
- 3 iterations, 64 MB memory, 1 degree of parallelism
- 256-bit output used as MEK

### Randomness
- Cryptographically secure random generator only

---

# 6. Authentication Architecture

## 6.1 WebAuthn (Primary Auth)

WebAuthn provides:
- Public/private key authentication
- Phishing resistance
- Device-bound credentials
- No shared secrets stored on server

---

## 6.2 Registration Flow

1. Client requests challenge.
2. Server generates challenge.
3. Client creates credential.
4. Server verifies attestation.
5. Server stores:
   - credentialId
   - publicKey
   - signCount

---

## 6.3 Login Flow

1. Client requests authentication challenge.
2. Server sends challenge.
3. Client signs challenge with private key.
4. Server verifies signature.
5. Server issues:
   - Access token (15 minutes)
   - Refresh token (7 days)

---

## 6.4 Token Strategy

- Access tokens are short-lived.
- Refresh tokens are rotated.
- Reuse detection invalidates sessions.
- Refresh tokens stored hashed in database.

---

# 7. Database Schema

## User
- id (uuid)
- email
- mfaEnabled
- passwordHash (optional fallback)
- createdAt

## UserEncryption
- id (uuid)
- userId
- salt (Base64 encoded string for Argon2 MEK derivation)
- createdAt
- updatedAt

## WebAuthnCredential
- id
- userId
- credentialId
- publicKey
- counter
- transports

## Device
- id
- userId
- deviceName
- encryptedMEK
- isTrusted
- createdAt

## Vault
- id
- userId
- encryptedData
- version
- updatedAt

## RefreshToken
- id
- userId
- tokenHash
- expiresAt
- revoked

---

# 8. Multi-Device Encrypted Sync

## 8.1 Device Onboarding

1. New device generates key pair.
2. Existing device encrypts MEK using new device public key.
3. Server stores encrypted MEK.
4. New device decrypts MEK locally.

Server never sees plaintext MEK.

---

## 8.2 Sync Process

1. Device fetches encrypted vault.
2. Decrypt locally.
3. Merge changes.
4. Increment version.
5. Re-encrypt.
6. Push updated blob to server.

Conflict resolution:
- Version-based strategy
- Last-write-wins (initial implementation)

---

# 9. Offline-First Architecture

Mobile app must:

- Store encrypted vault locally.
- Allow full CRUD offline.
- Queue sync operations.
- Reconcile on reconnect.

Vault remains encrypted at rest.

---

# 10. Mobile Security Controls

- Biometric unlock required / explicitly gated
- Auto-lock after inactivity (5 minutes)
- Clear MEK from memory on background
- Prevent screenshots where possible
- Clipboard auto-clear (30 seconds)
- Local Enclave Purge (destructive wipe of encryption keys)
- Vault Export (decrypted JSON localized export)
- No sensitive logging

---

# 11. Backend Security Controls

- Rate limiting on auth endpoints
- Strict CORS configuration
- CSP headers
- Structured logging
- Centralized error handling
- Device Trust Binding (`X-Device-Id` enforcement for multi-device management)
- Optional 2FA (Email OTP verification)
- No secrets committed
- Dockerized deployment

---

# 12. Development Phases

Phase 1 – Monorepo setup  
Phase 2 – WebAuthn backend  
Phase 3 – Crypto package  
Phase 4 – Mobile authentication  
Phase 5 – Vault encryption  
Phase 6 – Multi-device sync  
Phase 7 – Hardening + Documentation  

---

# 13. Known Limitations

- Secure Enclave access abstracted via Expo
- Advanced conflict resolution not implemented initially
- Rooted device protection not guaranteed
- Certificate pinning optional

---

# 14. Design Principles

- Zero-knowledge by default
- Encryption before transmission
- Keys never server-side
- Secure by design, not by patching

