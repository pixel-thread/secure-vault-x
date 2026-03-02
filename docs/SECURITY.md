
# SecureVault X – Security Documentation

## 1. Security Philosophy

SecureVault X is built on zero-knowledge principles.

The server must never:
- Store plaintext vault data
- Store encryption keys
- Be capable of decrypting user secrets

Security is enforced through cryptographic isolation and strict key hierarchy.

---

# 2. Assets

- Master Encryption Key (MEK)
- Encrypted vault blob
- WebAuthn credentials
- JWT tokens
- Refresh tokens
- Device encrypted MEKs

---

# 3. Threat Model

## 3.1 Threat Actors

1. Database breach attacker
2. Malicious server operator
3. Stolen device attacker
4. Network MITM attacker
5. Token thief
6. Phishing attacker

---

# 4. Attack Vectors & Mitigations

## 4.1 Database Breach

Threat:
Attacker obtains full database dump.

Mitigation:
- Vault encrypted using AES-256-GCM
- MEK never stored plaintext
- No password hashes used in WebAuthn mode
- Refresh tokens hashed
- Server cannot decrypt vault

Result:
Data remains cryptographically protected.

---

## 4.2 Malicious Server Operator

Threat:
Server attempts to inspect vault data.

Mitigation:
- End-to-end encryption
- No key transmission
- Encrypted MEK storage only

Server is cryptographically blind.

---

## 4.3 Stolen Phone

Threat:
Attacker steals unlocked device.

Mitigation:
- Secure Enclave / Keystore key protection
- Biometric unlock required
- Auto-lock after inactivity
- Clear MEK from memory on background

Residual Risk:
If device fully compromised (root), protections may fail.

---

## 4.4 MITM Attack

Threat:
Network interception.

Mitigation:
- HTTPS mandatory
- TLS enforcement
- Optional certificate pinning

Encrypted vault still protected even if intercepted.

---

## 4.5 Token Theft

Threat:
Attacker steals refresh token.

Mitigation:
- Short-lived access tokens
- Refresh token rotation
- Reuse detection
- Token hashing in DB

Replay results in session invalidation.

---

## 4.6 Phishing

Threat:
User tricked into submitting credentials.

Mitigation:
- WebAuthn prevents credential replay
- No password transmitted

---

# 5. Cryptographic Controls

## 5.1 Vault Encryption

Algorithm:
AES-256-GCM

Requirements:
- Unique IV per encryption
- Secure RNG
- Authentication tag verification

---

## 5.2 Key Management

- MEK generated client-side
- MEK encrypted using device-bound key
- Device-bound key stored in Secure Enclave/Keystore
- Keys cleared from memory on background

---

## 6. Authentication Security

- WebAuthn passwordless login
- Public/private key cryptography
- Challenge-response verification
- Replay attack prevention
- Sign counter validation

---

# 7. Session Security

- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Rotation enforced
- Reuse detection
- Tokens stored securely on device

---

# 8. Logging & Monitoring

Log:
- Failed login attempts
- Token reuse detection
- Device additions
- Vault version conflicts

Never log:
- Vault contents
- Encryption keys
- Tokens
- Secrets

---

# 9. Security Assumptions

- OS-level secure enclave is trusted
- TLS correctly configured
- Device not fully compromised
- WebAuthn implementation correctly verified

---

# 10. Limitations

- No protection against fully rooted devices
- No hardware-backed key export protection beyond platform guarantees
- Conflict resolution simplified

---

# 11. Secure Development Rules

- No deprecated crypto
- No hardcoded secrets
- No IV reuse
- No plaintext storage
- Strong typing required
- Mandatory input validation

---

# 12. Security Review Checklist

Before production:

- [ ] Verify IV uniqueness
- [ ] Confirm no keys server-side
- [ ] Ensure refresh rotation works
- [ ] Validate WebAuthn signature checks
- [ ] Confirm no sensitive logs
- [ ] Validate secure storage usage
- [ ] Run dependency audit

---

# 13. Security Summary

SecureVault X enforces:

- Zero-knowledge architecture
- Client-side encryption
- Device-bound key hierarchy
- Passwordless authentication
- End-to-end encrypted synchronization
- Strict session lifecycle controls

The system is designed so that even full backend compromise does not expose user vault data.
