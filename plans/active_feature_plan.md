# Plan: Extend Secret Fields & Dynamic Form
**Status:** ACTIVE
**PRD Reference:** .agents/prd/core_prd.md
**Model Used:** Anthropic/Google
**Last Updated:** 2026-03-20

## Overview
Update the frontend architecture of SecureVault X to support multiple dynamic secret types (Login, Bank Card, Crypto Wallet, etc.) instead of hardcoded forms. We will introduce new TypeScript types for `Secret` and utilize a templating system to dynamically render the correct fields for the selected secret type without modifying the backend zero-knowledge schema.

## Requirements
- Introduce comprehensive TypeScript types for `Secret`, `SecretField`, `SecretMeta`, and `SecretTemplate`.
- Provide predefined `SECRET_TEMPLATES` for different secret types (api_key, database, crypto, identity, login, card, etc.).
- Update the mobile app to use a single, reusable `AddSecretForm` that dynamically adapts based on the secret type chosen by the user.
- Ensure the payload structurally matches the new `Secret` interface before being passed to `encryptData`.
- The database schema (`schema.prisma`) requires **no changes**, as all metadata and fields are encrypted client-side and stored as a generic blob.

## Architecture Changes
- **[NEW] `apps/mobile/src/types/secret.ts`**: Store the newly provided types (`SecretType`, `FieldType`, `SecretField`, `SECRET_TEMPLATES`, etc.).
- **[NEW] `apps/mobile/src/components/screens/vault/AddSecretForm.tsx`**: A dynamic, reusable form component that takes a `SecretTemplate` and renders `FormField` inputs dynamically.
- **[MODIFY] Mobile Navigation/Vault UI**: Update the flow where users press "add" to first prompt for a type (if applicable) or pass down the selected type to the full-page dynamic form.
- **[DELETE] / [DEPRECATE] `AddPasswordForm.tsx` & `AddBankCardForm.tsx`**: Gradually replace these hardcoded forms with the universal `AddSecretForm`.

## Implementation Steps

### Phase 1: Core Types & Templating
1. **[IMPL] Create Shared Types & Templates** (File: `apps/mobile/src/types/secret.ts`)
   - Action: Add the provided interfaces (`SecretType`, `SecretField`, `Secret`, etc.) and `SECRET_TEMPLATES` object.
   - Why: Establishes the new domain model for dynamically structured secrets.
   - Risk: Low.

### Phase 2: Dynamic Form Component
2. **[IMPL] Build `AddSecretForm`** (File: `apps/mobile/src/components/screens/vault/AddSecretForm.tsx`)
   - Action: Implement a React Hook Form + Zod driven dynamic form that iterates over a given template's fields.
   - Why: Replaces hardcoded forms with a resilient, dynamic form builder.
   - Risk: Medium - ensuring correct validation states dynamically.

### Phase 3: Update Integration Points
3. **[IMPL] Update Vault screen navigation** (File: e.g., `apps/mobile/src/app/(tabs)/vault/add.tsx` or similar routing logic.)
   - Action: Update the "add" button behavior to navigate to the new dynamic page and pass `secretType`. Replace the existing `AddPasswordForm`.
   - Why: Wire up the new UI.
   - Risk: Medium.

### Phase 4: Security Review
4. **[REVIEW] Final Security Audit**
   - Action: Check that the new payload is correctly fully encrypted. Metadata and tags shouldn't leak unencrypted.
   - Risk: Low.

## Security Flags
> **Zero-Knowledge Check**: We must ensure that the newly extended fields (`SecretField`, `SecretMeta`) are included inside the `data` payload sent to `encryptData()`. No plain-text fields (other than strictly required routing info) should be saved to the Vault database table. The backend remains completely oblivious to `SecretType` or any inner field structures.

## Testing Strategy
- **Unit tests**: Validate that `SECRET_TEMPLATES` successfully load and generate Zod schemas dynamically.
- **E2E/Integration**: Provide a manual testing path: User presses "Add", selects a template like "Crypto Wallet", fills out dynamic fields ("Wallet Name", "Seed Phrase"), presses "Save". Vault should decrypt the generic object and display it properly.

## Success Criteria
- [ ] `Secret` TypeScript types are integrated.
- [ ] Dynamic form correctly renders based on `type`.
- [ ] User can add different generic secrets safely using zero-knowledge encryption.
