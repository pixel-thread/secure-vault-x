# 🔐 SecureVaultX

Zero-Knowledge, End-to-End Encrypted Password Manager  
Monorepo • TypeScript • Hono • Expo • WebAuthn

---

## 🚀 Overview

SecureVault X is a production-grade, zero-knowledge password manager built with a TypeScript monorepo architecture.

It features:

- 🔑 WebAuthn passwordless authentication
- 🔐 End-to-end encrypted vault storage
- 📱 Secure Enclave / Android Keystore key protection
- 🔄 Multi-device encrypted synchronization
- 📶 Offline-first mobile architecture
- 🛡 Two-Factor Authentication (Email OTP)
- 📌 Trusted Device Management
- ⬇️ Secure Vault Export (Decrypted offline backup)
- 🔁 Refresh token rotation with reuse detection
- 🛡 Strong threat-modeled security architecture

The backend is cryptographically incapable of decrypting vault contents.

---

# 🏗 Architecture

SecureVault X uses a monorepo structure with shared packages.

```
SecureVaultX/  
├── apps/  
│ ├── api/ # Hono backend  
│ ├── mobile/ # Expo React Native app  
├── packages/  
│ ├── crypto/ # Shared encryption utilities  
│ ├── types/ # Shared TypeScript types  
│ ├── config/ # Shared config  
├── prisma/  
├── docker/  
├── docs/  
└── README.md

````

---

# 🧠 Zero-Knowledge Model

SecureVault X is designed so that:

- All encryption happens client-side.
- The Master Encryption Key (MEK) is generated on device.
- The server only stores encrypted blobs.
- Encryption keys never leave the client unencrypted.
- Even a full database breach does not expose vault contents.

---

# 🔐 Cryptographic Design

## Key Hierarchy

Master Encryption Key (MEK)  
↓  
AES-256-GCM vault encryption  

MEK is encrypted using a device-bound key stored in:

- iOS Secure Enclave
- Android Keystore

---

## Encryption Standards

Vault encryption:
- AES-256-GCM
- 12-byte random IV
- Authenticated encryption
- No IV reuse

Optional password fallback:
- PBKDF2
- 310,000 iterations
- SHA-256
- 256-bit output

All randomness uses cryptographically secure RNG.

---

# 🔑 Authentication (WebAuthn)

SecureVault X uses passwordless authentication via WebAuthn.

## Registration

1. Client requests challenge.
2. Server generates challenge.
3. Client creates credential.
4. Server verifies attestation.
5. Public key stored server-side.

## Login

1. Client requests authentication challenge.
2. Client signs challenge.
3. Server verifies signature.
4. JWT tokens issued.

No passwords stored or transmitted.

---

# 🔁 Session Security

- Access token: 15 minutes
- Refresh token: 7 days
- Refresh token rotation enforced
- Reuse detection invalidates session
- Tokens stored securely on device

---

# 🔄 Multi-Device Encrypted Sync

When adding a new device:

1. New device generates key pair.
2. Existing device encrypts MEK with new device public key.
3. Server stores encrypted MEK.
4. New device decrypts MEK locally.

Server never sees plaintext encryption keys.

---

# 📱 Offline-First Mobile Design

The mobile app:

- Stores encrypted vault locally (SQLite/MMKV).
- Allows full CRUD offline.
- Queues sync operations.
- Resolves conflicts using versioning.
- Keeps vault encrypted at rest.

---

# 🛡 Security Controls

## Mobile

- Biometric unlock required
- Auto-lock after inactivity
- Clear keys from memory on background
- Clipboard auto-clear
- Screenshot prevention where possible

## Backend

- Rate limiting on auth endpoints
- Strict CORS configuration
- CSP headers
- Centralized error handling
- Structured logging
- No secrets committed to repo

---

# 🗄 Database Models

User  
UserEncryption  
WebAuthnCredential  
Device  
Vault  
RefreshToken  
OtpVerification  

See `/docs/ARCHITECTURE.md` for detailed schema.

---

# 🐳 Running Locally

## 1️⃣ Install dependencies

```bash
pnpm install
````

## 2️⃣ Setup environment variables

Create `.env` in `/apps/api`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/securevault
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
WEB_AUTHN_RP_ID=localhost
WEB_AUTHN_ORIGIN=https://localhost:3000
```

## 3️⃣ Start PostgreSQL (Docker)

```bash
docker compose up -d
```

## 4️⃣ Run Prisma migrations

```bash
pnpm --filter api prisma migrate dev
```

## 5️⃣ Start backend

```bash
pnpm --filter api dev
```

## 6️⃣ Start mobile app

```bash
pnpm --filter mobile start
```

---

# 📂 Documentation

- Architecture → `/docs/ARCHITECTURE.md`
    
- Security → `/docs/SECURITY.md`
    

---

# ⚠ Known Limitations

- Full protection not guaranteed on rooted devices
    
- Conflict resolution simplified
    
- Secure Enclave APIs abstracted through Expo
    
- Certificate pinning optional (recommended for production)
    

---

# 🎯 Resume Summary

Architected and implemented a zero-knowledge, end-to-end encrypted password manager using a TypeScript monorepo (Hono + Expo). Designed WebAuthn passwordless authentication, Secure Enclave–protected key hierarchy, offline-first encrypted storage, and multi-device encrypted synchronization with refresh token rotation and strict threat-modeled security controls.

---

# 🔎 Security Philosophy

Security is enforced through architecture, not patching.

- No plaintext storage
    
- No encryption keys server-side
    
- No deprecated crypto
    
- Short-lived tokens
    
- Strict key lifecycle control
    

Even full backend compromise does not expose vault contents.

---

# 📜 License
MIT (or specify your preferred license)
