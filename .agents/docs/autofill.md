# SecureVault X: System-Wide Autofill Architecture

This document explains the technical implementation of the system-wide autofill feature and provides guidelines for future maintenance and updates.

---

## 🏗️ Architecture Overview

The autofill system is designed to be **fully self-contained** within the Expo environment. It uses an **Expo Config Plugin** (`apps/mobile/plugins/withPasswordManager.js`) to inject native Kotlin and Swift code dynamically during the `prebuild` phase.

### Why this approach?

- **No Native Sprawl**: Instead of managing a separate `android/` or `ios/` folder, all native logic lives inside the plugin as template strings.
- **Dynamic Package Alignment**: The plugin automatically detects the build's package name (e.g., `com.pixelthread.securevaultx.dev`) and rewrites the Kotlin `package` declarations and directory paths on the fly.
- **Consistent Across Environments**: This ensures that local builds and EAS cloud builds always have perfectly aligned namespaces.

---

## 🤖 Android Implementation

### 1. `PasswordAutofillService.kt`

The core of the Android integration. It is registered in the `AndroidManifest.xml` as a system service.

#### Key Features:

- **AssistStructure Traversal**: The service recursively crawls the requesting app's view tree to find username and password nodes.
- **Web Domain Extraction**: For browsers (Chrome, Safari), it extracts the `webDomain` property from the `ViewNode` to provide website-specific suggestions.
- **Fuzzy Matching**: It prioritizes matching by `webDomain` first, then falls back to `packageName` (the ID of the app).
- **Secure Storage**: It uses `EncryptedSharedPreferences` with `MasterKey` to securely share credentials between the main React Native app and the native Autofill background service.

### 2. `PasswordManagerModule.kt`

A React Native bridge that allows the JS layer to communicate with the native secure storage.

- `saveCredential(domainOrPackage, user, pass)`: Persists a new credential for the OS to use.
- `getCredentials(domainOrPackage)`: Retrieves stored credentials for UI verification.

---

## ⚛️ React Native Integration

### `usePasswordManager` Hook

Provides a clean JS interface for interacting with the native module.

- Located in: `apps/mobile/src/hooks/usePasswordManager.ts`.

### Automatic Synchronization

The `AddSecretForm.tsx` component is configured to automatically sync credentials to the system Autofill whenever a user "Locks it in".

- **Logic**: It extracts fields labeled "Website", "URL", "Username", and "Password" and calls `saveCredential` in the background.

---

## 🚀 How to Updated & Maintain

### 1. Modifying Native Logic

If you need to update the logic in the `AutofillService` or the native bridge:

1. Open `apps/mobile/plugins/withPasswordManager.js`.
2. Locate the corresponding Kotlin/XML template string (e.g., `PASSOWRD_AUTOFIL_SERVICE_KT`).
3. Make your changes directly in the template.
4. **Apply Changes**: Run a clean prebuild and build:
   ```bash
   npx expo prebuild --platform android --clean
   eas build --profile development --platform android --local
   ```

### 2. Debugging Native Logic (Logcat)

The native code includes a custom tag `SecureVaultX` for easier debugging.
To see the autofill matches in real-time, run:

```bash
adb logcat | grep SecureVaultX
```

You will see logs for initialization, web domain discovery, and credential match success/failure.

---

## 🍎 iOS Implementation (Planned)

The iOS implementation follows the same plugin-based pattern using a **`CredentialProviderExtension`**. It utilizes **App Groups** (`group.com.securevaultx.autofill`) to share data between the main app and the extension via a secure shared Keychain.

### Future Work:

- Ensure the extension's `Info.plist` is correctly configured in the Config Plugin.
- Maintain parity between the Android and iOS secure storage keys.
