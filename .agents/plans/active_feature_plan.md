# Plan: File Encryption Feature
**Status:** ACTIVE
**PRD Reference:** .agents/prd/features/file-encryption-feature-prd.md
**Model Used:** Gemini 3 Pro
**Last Updated:** 2026-03-21

## Tasks
- [x] [PLAN]   Update implementation plan with cleanup and review steps
- [ ] [SEC]    Identify and model all security-sensitive surfaces (Zero-Knowledge, Memory limits)
- [ ] [DESIGN] Schema design for File SecretType
- [ ] [TEST]   Write testing logic for file picker and base64 handling
- [ ] [IMPL]   Implement file selection and base64 encoding
- [ ] [IMPL]   Implement client-side encryption of file payloads
- [ ] [IMPL]   Implement View/Download flow for decrypted files with cleanup
- [ ] [REVIEW] Run `refactor-cleaner.md` skill on new components
- [ ] [REVIEW] Run `simplified.md` skill on new components
- [ ] [REVIEW] Security review gate (`security.md`)

## Security Flags
> A02 - Cryptographic Failures: Must ensure IV is uniquely mapped to the file payload correctly.
> A04 - Insecure Design: Need to limit file sizes (e.g., 5MB) to avoid OOM or DoS during Base64 decoding/encryption.
> Zero-Knowledge & Ephemeral Storage: Base64 decrypted data must be stored in isolated App internal storage and DELETED on unmount.
> Threat 2: Data Exfiltration via malicious files (Picker shouldn't trigger external network requests).

## Proposed Changes

### Types & Validation
- **[MODIFY] `packages/types/src/secret.ts`**: Add `"file"` to `SecretType`.
- **[MODIFY] `packages/validators/src/secrets.ts`**: Add `fileSchema` enforcing metadata validation for files.

### UI & File Selection
- **[NEW] `apps/mobile/src/components/screens/secret/AddFileForm.tsx`**: Utilizes `expo-document-picker` for selecting a file, encodes as base64, encrypts via `@securevault/crypto`, and pushes to vault.
- **[NEW] `apps/mobile/src/components/screens/secret/FileDetail.tsx`**: For viewing/decrypting files using `expo-sharing`. Includes `useEffect` cleanup to delete temporary files from `FileSystem.cacheDirectory` when view is closed.

## Post-Implementation Review
- **Refactoring:** Apply `refactor-cleaner.md` to remove dead code and `ts-prune`.
- **Simplification:** Apply `simplified.md` to document cryptography logic clearly and eliminate nested conditions.
- **Security:** Ensure `security.md` rules are strictly followed around token leaks or text leaks.
