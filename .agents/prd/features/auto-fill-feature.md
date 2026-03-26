---
trigger: always_on
---

# Feature PRD: System-Wide Autofill (OS-Level)

## Overview

SecureVault X aims to provide Bitwarden-like system-wide autofill capabilities across both Android and iOS devices. This feature detects login forms in any application or website at the OS level and seamlessly offers to autofill credentials from the user's secure vault. Since Expo does not natively support system-wide autofill services out-of-the-box, we will implement this by injecting a custom native module and configuring Expo plugins.

---

## User Requirements

### System-Wide Detection & Autofill

- **Detect Login Forms:** The OS-level service must recognize username/password fields seamlessly in other third-party apps and browsers.
- **Provide Credentials:** The service should securely supply the correct credentials to the OS autofill framework when requested.
- **Save Credentials:** If a user logs into a new app/website, the service should prompt them to save the newly entered credentials to their vault.

### Application Integration

- Accessible and manageable via the SecureVault X React Native application.
- Uses native bridging to allow the React Native JS layer to interact with the securely saved credentials.

### Security Constraints

- **Zero-Knowledge Encryption:** Credentials stored for autofill must be encrypted at rest on the device.
  - **Android:** Uses `EncryptedSharedPreferences` with `AES256_GCM`.
  - **iOS:** Uses the native device Keychain (`kSecClassGenericPassword`) requiring device unlock (`kSecAttrAccessibleAfterFirstUnlock`).
- **No JS-Side Form Scanning:** Detection strictly occurs via the native OS (Android `AutofillService` / iOS `CredentialProviderExtension`).
- **Isolated Target:** The iOS Credential Provider Extension must run as a separate Xcode target to comply with Apple's security sandbox.

---

## Architecture Overview

1. **Android `AutofillService` (Kotlin):** An OS-level service handling `onFillRequest` and `onSaveRequest` via `AssistStructure` parsing.
2. **iOS `ASCredentialProviderExtension` (Swift):** An App Extension implementing `ASCredentialProviderViewController` to serve passwords to the iOS system.
3. **React Native Bridge (`PasswordManagerModule`):** A custom native module allowing the React Native app to get and save credentials securely to the native stores used by the autofill services.
4. **Expo Config Plugin (`withPasswordManager.js`):** A custom Expo config plugin to automatically generate the required Android Manifest entries, iOS Associated Domains entitlements, inject native code files into the prebuild, and configure the Xcode target.

---

## Implementation Plan

### Phase A: Native Android Implementation

#### A1 — Android Service (`PasswordAutofillService.kt`)

- Extend `AutofillService` to handle `onFillRequest` and `onSaveRequest`.
- Implement `StructureParser` to recursively scan `AssistStructure` for `AUTOFILL_HINT_PASSWORD` and `AUTOFILL_HINT_USERNAME`.
- Create `CredentialStore` using `EncryptedSharedPreferences` with Android Keystore (`MasterKey`).

#### A2 — Service Registration

- Create `autofill_service.xml`.
- Expose the service in `AndroidManifest.xml` via the Expo plugin.

### Phase B: Native iOS Implementation

#### B1 — Credential Provider Extension (`CredentialProviderViewController.swift`)

- Implement `provideCredentialWithoutUserInteraction` and `prepareCredentialList`.
- Read and manage credentials securely via `KeychainStore.swift`.

#### B2 — Xcode Target & Entitlements

- Add `com.apple.developer.associated-domains` entitlement.
- Add the App Extension target to the Xcode project during Expo prebuild.

### Phase C: React Native Integration

#### C1 — Native Bridge Module

- Create `PasswordManagerModule` in Android and equivalent on iOS.
- Expose `saveCredential` and `getCredentials` methods to JS.

#### C2 — React Native Hook

- Create `usePasswordManager.ts` to interface with the `NativeModules.PasswordManager`.

### Phase D: Expo Config Plugin

- Create `plugins/withPasswordManager.js`.
- Automate modifying `AndroidManifest.xml` to include `android.permission.BIND_AUTOFILL_SERVICE`.
- Automate copying Kotlin/Swift files to their respective native directories.
- Automate injection of the `PasswordExtension` target into the Xcode `.pbxproj` file using `@expo/config-plugins`.

---

## Execution Workflow

1. **Write Native Files:** Implement the Kotlin and Swift templates directly within a `native/` template directory.
2. **Build the Config Plugin:** Write the Expo plugin to handle copying these files and modifying native configurations dynamically.
3. **Integrate into `app.json`:** Register the `withPasswordManager` plugin.
4. **JS Wiring:** Build the `usePasswordManager` hook and the UI settings toggle to enable the service.
5. **App Build:** Run `npx expo prebuild` and compile with a custom dev client (`eas build --profile development` or `npx expo run:android`).

---

## Acceptance Criteria

- [ ] Android `AutofillService` explicitly logs and detects standard login forms.
- [ ] iOS Extension successfully registers as a Password Manager in iOS Settings.
- [ ] Expo prebuild successfully creates the necessary native files and links Android Manifest and iOS permissions without manual intervention.
- [ ] Native bridge (`NativeModules.PasswordManager`) successfully completes read/write of encrypted credentials.
- [ ] The feature only interacts with the device's native encrypted stores (Keychain / Keystore), preserving zero-knowledge architecture.

---

## Out of Scope

- Syncing these autofill credentials with the backend vault (this PRD restricts scope to _system detection and native secure storage_; sync integration will be a separate feature).
- React Native CLI support (this relies on Expo config plugins).
