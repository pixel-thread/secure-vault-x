---
trigger: always_on
---

# Feature PRD: File Encryption & Vault Storage

**Status:** DRAFT  
**Author:** Antigravity  
**Date:** 2026-03-21  
**Skill Reference:** [.agents/skills/code-reviewer.md](file:///Users/harrison/Downloads/secure-vault-x/.agents/skills/code-reviewer.md)

## 1. Problem Statement
Users currently can only store structured text data (login, notes, api keys) in SecureVault X. There is a need to support secure storage of small files (e.g., images of identity cards, PDF documents) with the same zero-knowledge guarantees as existing vault items.

## 2. Goals
- Provide a seamless "Add File" flow in the mobile application.
- Ensure all file data is encrypted client-side before being synchronized to the server.
- Maintain consistency with the existing `VaultItem` and sync architecture.

## 3. User Stories
- **US1:** As a user, I want to select a file from my device and add it to my secure vault.
- **US2:** As a user, I want to see a list of my stored files alongside other vault items.
- **US3:** As a user, I want to decrypt and view/download a file I previously stored.

## 4. Technical Flow & Requirements

### 4.1 Flow Diagram (Simplified)
`File Selection` -> `Read as Binary` -> `Base64 Encode` -> `AES-256-GCM Encrypt` -> `Create Vault Item` -> `Sync to Server`

### 4.2 Detailed Steps
1. **File Selection**: Integrate `expo-document-picker` or `expo-image-picker` to allow the user to select a file.
2. **Base64 Encoding**: Convert the raw file data into a Base64 string. This ensures the binary data can be handled as a string payload for the encryption utility and JSON serialization.
3. **Encryption**: 
   - Use the existing `@securevault/crypto` package (`encryptData<T>`).
   - The Base64 string will be treated as the data payload.
   - Encryption MUST happen client-side using the user's Master Encryption Key (MEK).
4. **Vault Item Structure**:
   - Create a new `SecretType`: `"file"`.
   - The encrypted blob will contain the Base64 encoded file content.
   - Metadata (fileName, fileType, fileSize) should also be encrypted within the blob or stored as encrypted fields.
5. **Storage & Sync**: Follow the established `syncPushSchema` and `syncItemSchema` for persistence and multi-device synchronization.

### 4.3 Security Constraints
- **Zero-Knowledge**: The server MUST NEVER receive the plaintext file or the Base64 representation.
- **Size Limit**: Implement an initial limit of 5MB per file to prevent performance degradation and excessive storage costs (adjustable in future phases).
- **IV Uniqueness**: Ensure a unique 12-byte IV is generated for every file encryption operation (managed by `encryptData`).

## 5. Development & Review Process
All implementation code (crypto updates, UI components, hooks) must undergo a rigorous review process.

### 5.1 Code Review Requirement
Developers MUST use the `@.agents/skills/code-reviewer.md` specialist to audit the implementation. Key focus areas:
- **No Hardcoded Keys**: Verify that no encryption keys or temporary Base64 strings are leaked into source code or logs.
- **Memory Management**: Ensure large Base64 strings are handled efficiently and cleared from memory when no longer needed.
- **Custom Logger**: Proactively forbid `console.log` in mobile development; use the custom `@securevault/utils-native` logger.

## 6. Success Metrics
- 100% of files stored are encrypted before leaving the device.
- Successful decryption and reconstruction of files on secondary devices.
- Zero PII or plaintext file data leaked to backend logs.

## 7. Future Roadmap
- Support for larger files via chunked encryption and storage.
- In-app preview for common file types (PDF, JPG, PNG).
- Integration with device-level file sharing intent.
