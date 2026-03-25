/**
 * ============================================================
 *  SecureVault X — Production-Grade Autofill Expo Plugin
 *  withPasswordManager.js
 * ============================================================
 *
 *  FEATURES
 *  ─────────────────────────────────────────────────────────
 *  • Android AutofillService (API 26+)
 *  • Inline autofill suggestions (API 30+)
 *  • Save credentials prompt after form submit
 *  • AES-256 EncryptedSharedPreferences vault
 *  • Multi-heuristic field detection
 *    ↳ htmlInfo (Chrome / WebView / Firefox / Edge)  ← NEW
 *    ↳ autofillHints (native apps)
 *    ↳ inputType bitmask
 *    ↳ id/description/hint text fragments
 *    ↳ proximity heuristic (fallback)
 *  • Fuzzy domain / package matching
 *  • React Native bridge (saveCredential / getCredentials / deleteCredential / listSites / clearAll)
 *  • iOS App Group entitlement scaffold
 *  • Comprehensive ADB-friendly logging (tag: SecureVaultX)
 *
 *  ADB LOGCAT COMMANDS
 *  ─────────────────────────────────────────────────────────
 *  # All SecureVaultX logs:
 *    adb logcat -s SecureVaultX
 *
 *  # Only errors:
 *    adb logcat -s SecureVaultX:E
 *
 *  # Live pretty-print (colour):
 *    adb logcat -s SecureVaultX -v color
 *
 *  # Save to file:
 *    adb logcat -s SecureVaultX > vault_debug.txt
 *
 *  # Clear buffer first then watch:
 *    adb logcat -c && adb logcat -s SecureVaultX -v time
 *
 *  LOG PREFIXES USED INSIDE THE SERVICE
 *  ─────────────────────────────────────────────────────────
 *  [FILL]   → onFillRequest lifecycle
 *  [SAVE]   → onSaveRequest lifecycle
 *  [PARSE]  → ViewNode traversal — native field detection
 *  [WEB]    → ViewNode traversal — htmlInfo / browser fields
 *  [MATCH]  → Credential lookup / fuzzy matching
 *  [VAULT]  → EncryptedSharedPreferences read/write
 *  [BRIDGE] → React Native module calls
 *  [INLINE] → Inline suggestion builder (API 30+)
 *  [ERROR]  → All caught exceptions
 * ============================================================
 */

const {
  withAndroidManifest,
  withEntitlementsPlist,
  withDangerousMod,
  withMainApplication,
  withAppBuildGradle,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const pkg = { name: 'secure-vault-x-password-manager', version: '2.1.0' };

// ═══════════════════════════════════════════════════════════════════════════════
//  ANDROID XML RESOURCES
// ═══════════════════════════════════════════════════════════════════════════════

const AUTOFILL_SERVICE_XML = `<?xml version="1.0" encoding="utf-8"?>
<!--
  autofill_service.xml
  Declares this app as a system AutofillService.
  The settingsActivity value points to your app's main screen so Android
  can open it when the user taps "Settings" in the autofill picker.
-->
<autofill-service
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:settingsActivity="PACKAGE_NAME.MainActivity" />`;

// ═══════════════════════════════════════════════════════════════════════════════
//  KOTLIN: PasswordAutofillService.kt
// ═══════════════════════════════════════════════════════════════════════════════

const PASSWORD_AUTOFILL_SERVICE_KT = `package PACKAGE_NAME.autofill

import android.app.PendingIntent
import android.app.assist.AssistStructure
import android.content.Intent
import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.*
import android.text.InputType
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import android.widget.inline.InlinePresentationSpec
import androidx.annotation.RequiresApi
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONArray
import org.json.JSONObject

/**
 * SecureVaultX AutofillService
 *
 * Works across:
 *  • Native Android apps  — via autofillHints + inputType
 *  • Chrome / WebView     — via node.htmlInfo (type=password, autocomplete=*)
 *  • Firefox / Edge       — via htmlInfo + idEntry fallback
 *  • Embedded WebViews    — via webDomain + proximity heuristic
 *
 * ADB filter tag: SecureVaultX
 * Log prefixes: [FILL] [SAVE] [PARSE] [WEB] [MATCH] [VAULT] [INLINE] [ERROR]
 */
class PasswordAutofillService : AutofillService() {

    companion object {
        private const val TAG = "SecureVaultX"
        private const val PREFS_FILE = "secure_vault_autofill_prefs"
        private const val PREFS_KEY  = "credentials"

        // ── Native input type masks ──────────────────────────────────────────
        private val PASSWORD_INPUT_TYPE_MASKS = listOf(
            InputType.TYPE_TEXT_VARIATION_PASSWORD,
            InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD,
            InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD,
            InputType.TYPE_NUMBER_VARIATION_PASSWORD
        )

        // ── HTML autocomplete values → password ──────────────────────────────
        private val HTML_PASSWORD_AUTOCOMPLETE = setOf(
            "current-password", "new-password", "password"
        )

        // ── HTML autocomplete values → username ──────────────────────────────
        private val HTML_USERNAME_AUTOCOMPLETE = setOf(
            "username", "email", "tel", "nickname",
            "given-name", "family-name", "name",
            "webauthn"
        )

        // ── HTML input type="..." values ─────────────────────────────────────
        private val HTML_PASSWORD_TYPES = setOf("password")
        private val HTML_USERNAME_TYPES = setOf("email", "tel", "text", "search", "number")

        // ── Native autofillHints ─────────────────────────────────────────────
        private val NATIVE_USERNAME_HINTS = setOf(
            View.AUTOFILL_HINT_USERNAME,
            View.AUTOFILL_HINT_EMAIL_ADDRESS,
            View.AUTOFILL_HINT_PHONE
        )

        // ── id / description / hint text fragments ───────────────────────────
        private val USERNAME_ID_FRAGMENTS = setOf(
            "username", "user_name", "user", "email", "e-mail",
            "login", "loginid", "account", "userid", "uname",
            "identifier", "handle", "mobile", "phone"
        )
        private val PASSWORD_ID_FRAGMENTS = setOf(
            "password", "passwd", "pass", "pwd", "secret",
            "passphrase", "credentials", "pin"
        )
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onConnected() {
        super.onConnected()
        Log.i(TAG, "[FILL] AutofillService CONNECTED — SecureVaultX is active")
    }

    override fun onDisconnected() {
        super.onDisconnected()
        Log.i(TAG, "[FILL] AutofillService DISCONNECTED")
    }

    // ─── Fill Request ──────────────────────────────────────────────────────────

    override fun onFillRequest(
        request: FillRequest,
        cancellationSignal: CancellationSignal,
        callback: FillCallback
    ) {
        Log.d(TAG, "[FILL] ════════════════════════════════════════")
        Log.d(TAG, "[FILL] onFillRequest START (PID=\${android.os.Process.myPid()}) session=\${request.id}")

        cancellationSignal.setOnCancelListener {
            Log.w(TAG, "[FILL] Request CANCELLED by system")
        }

        try {
            val structure = request.fillContexts.last().structure
            val clientPackage = structure.activityComponent.packageName
            Log.d(TAG, "[FILL] Client package: \$clientPackage")

            val parsed = ParsedForm()
            for (i in 0 until structure.windowNodeCount) {
                structure.getWindowNodeAt(i)?.rootViewNode?.let {
                    traverseNode(it, parsed, depth = 0)
                }
            }

            // Proximity heuristic: password found but no username → scan backwards
            if (parsed.usernameNodes.isEmpty() && parsed.passwordNodes.isNotEmpty()) {
                applyProximityHeuristic(parsed)
            }

            Log.d(TAG, "[PARSE] FINAL — " +
                "usernameFields=\${parsed.usernameNodes.size}, " +
                "passwordFields=\${parsed.passwordNodes.size}, " +
                "webDomain=\${parsed.webDomain}, " +
                "totalNodes=\${parsed.nodeCount}, " +
                "webFieldsFound=\${parsed.webFieldsFound}"
            )

            if (parsed.usernameNodes.isEmpty() && parsed.passwordNodes.isEmpty()) {
                Log.d(TAG, "[FILL] No autofillable fields — returning null response")
                callback.onSuccess(null)
                return
            }

            val vault = loadVault()
            val siteKey = parsed.webDomain ?: clientPackage
            val credentials = matchCredentials(vault, siteKey, clientPackage, parsed.webDomain)

            Log.d(TAG, "[MATCH] Site key='\$siteKey' → \${credentials.size} credential(s)")

            val responseBuilder = FillResponse.Builder()

            if (credentials.isNotEmpty()) {
                credentials.forEachIndexed { idx, cred ->
                    responseBuilder.addDataset(buildDataset(cred, parsed, request, idx))
                    Log.d(TAG, "[FILL] Added dataset #\$idx for username=\${cred.username}")
                }
            } else {
                Log.d(TAG, "[FILL] No credentials in vault for '\$siteKey' — save-prompt only")
            }

            buildSaveInfo(parsed)?.let {
                responseBuilder.setSaveInfo(it)
                Log.d(TAG, "[FILL] SaveInfo attached — will prompt on form submit")
            }

            callback.onSuccess(responseBuilder.build())
            Log.d(TAG, "[FILL] onFillRequest END — success")

        } catch (e: Exception) {
            Log.e(TAG, "[ERROR] onFillRequest crashed: \${e.javaClass.simpleName} — \${e.message}", e)
            callback.onSuccess(null)
        }
    }

    // ─── Save Request ──────────────────────────────────────────────────────────

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) {
        Log.d(TAG, "[SAVE] ════════════════════════════════════════")
        Log.d(TAG, "[SAVE] onSaveRequest START")

        try {
            val structure = request.fillContexts.last().structure
            val clientPackage = structure.activityComponent.packageName

            val parsed = ParsedForm()
            for (i in 0 until structure.windowNodeCount) {
                structure.getWindowNodeAt(i)?.rootViewNode?.let {
                    traverseNode(it, parsed, depth = 0)
                }
            }

            val username = parsed.usernameNodes
                .mapNotNull { it.autofillValue?.textValue?.toString() }
                .firstOrNull { it.isNotBlank() }

            val password = parsed.passwordNodes
                .mapNotNull { it.autofillValue?.textValue?.toString() }
                .firstOrNull { it.isNotBlank() }

            val siteKey = parsed.webDomain ?: clientPackage
            Log.d(TAG, "[SAVE] username='\$username' | site='\$siteKey' | pkg='\$clientPackage'")

            if (!username.isNullOrBlank() && !password.isNullOrBlank()) {
                saveToVault(siteKey, username, password)
                Log.i(TAG, "[SAVE] ✓ Credential saved for site='\$siteKey' user='\$username'")
            } else {
                Log.w(TAG, "[SAVE] ✗ Incomplete credential — username='\$username' password=\${if (password != null) "***" else "null"}")
            }

            callback.onSuccess()
        } catch (e: Exception) {
            Log.e(TAG, "[ERROR] onSaveRequest crashed: \${e.javaClass.simpleName} — \${e.message}", e)
            callback.onSuccess()
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  NODE TRAVERSAL — multi-strategy field detection
    //
    //  Priority order:
    //    1. htmlInfo  (Chrome / WebView / Firefox)          [WEB]
    //    2. autofillHints  (well-behaved native apps)       [PARSE]
    //    3. inputType bitmask  (native apps)                [PARSE]
    //    4. id / description / hint text fragments          [PARSE]
    //    5. proximity heuristic  (post-traversal fallback)  [PARSE]
    // ═══════════════════════════════════════════════════════════════════════════

    private fun traverseNode(
        node: AssistStructure.ViewNode,
        form: ParsedForm,
        depth: Int
    ) {
        form.nodeCount++
        form.allNodes.add(node)

        // Collect web domain (set on any node inside Chrome / WebView)
        if (!node.webDomain.isNullOrBlank() && form.webDomain == null) {
            form.webDomain = node.webDomain
            Log.d(TAG, "[PARSE] webDomain='\${form.webDomain}' found at depth=\$depth")
        }

        // Skip nodes with no autofillId — they cannot be filled
        val autofillId = node.autofillId ?: run {
            recurseChildren(node, form, depth); return
        }

        val hints       = node.autofillHints ?: emptyArray()
        val idEntry     = node.idEntry?.lowercase() ?: ""
        val className   = node.className?.lowercase() ?: ""
        val contentDesc = node.contentDescription?.toString()?.lowercase() ?: ""
        val hintText    = node.hint?.toString()?.lowercase() ?: ""
        val inputType   = node.inputType
        val isEditText  = className.contains("edittext") ||
                          className.contains("textinputedittext") ||
                          node.isFocusable

        // ── STRATEGY 1: htmlInfo ─────────────────────────────────────────────
        //
        //  Chrome and most browsers set node.htmlInfo on every <input> element.
        //    tag          → "input"
        //    type         → "password" | "email" | "text" | …
        //    autocomplete → "current-password" | "username" | …
        //    name / id    → HTML name/id attribute
        //
        val htmlInfo  = node.htmlInfo
        val htmlTag   = htmlInfo?.tag?.lowercase()
        val htmlAttrs = htmlInfo?.attributes
            ?.associate { it.first.lowercase() to it.second.lowercase() }
            ?: emptyMap()

        if (htmlTag == "input") {
            val htmlType         = htmlAttrs["type"] ?: "text"
            val htmlAutocomplete = htmlAttrs["autocomplete"] ?: ""
            val htmlName         = htmlAttrs["name"] ?: ""
            val htmlId           = htmlAttrs["id"] ?: ""

            Log.v(TAG, "[WEB] <input> depth=\$depth type='\$htmlType' " +
                "autocomplete='\$htmlAutocomplete' name='\$htmlName' id='\$htmlId'")

            val isWebPassword =
                htmlType in HTML_PASSWORD_TYPES ||
                htmlAutocomplete in HTML_PASSWORD_AUTOCOMPLETE ||
                PASSWORD_ID_FRAGMENTS.any { htmlName.contains(it) || htmlId.contains(it) }

            if (isWebPassword && form.passwordNodes.isEmpty()) {
                form.passwordNodes.add(node)
                form.webFieldsFound = true
                Log.d(TAG, "[WEB] PASSWORD — type='\$htmlType' autocomplete='\$htmlAutocomplete' name='\$htmlName'")
                recurseChildren(node, form, depth); return
            }

            val isWebUsername =
                htmlAutocomplete in HTML_USERNAME_AUTOCOMPLETE ||
                (htmlType in HTML_USERNAME_TYPES && !isWebPassword) ||
                USERNAME_ID_FRAGMENTS.any { htmlName.contains(it) || htmlId.contains(it) }

            if (isWebUsername && form.usernameNodes.isEmpty()) {
                form.usernameNodes.add(node)
                form.webFieldsFound = true
                Log.d(TAG, "[WEB] USERNAME — type='\$htmlType' autocomplete='\$htmlAutocomplete' name='\$htmlName'")
                recurseChildren(node, form, depth); return
            }
        }

        // ── STRATEGY 2+3+4: Native hints / inputType / attribute fragments ───

        val isPasswordByHint = hints.any { it == View.AUTOFILL_HINT_PASSWORD }
        val isPasswordByType = PASSWORD_INPUT_TYPE_MASKS.any { mask -> (inputType and mask) != 0 }
        val isPasswordByAttr = PASSWORD_ID_FRAGMENTS.any { f ->
            idEntry.contains(f) || contentDesc.contains(f) || hintText.contains(f)
        }

        if (isEditText && (isPasswordByHint || isPasswordByType || isPasswordByAttr)) {
            if (form.passwordNodes.isEmpty()) {
                form.passwordNodes.add(node)
                Log.d(TAG, "[PARSE] NATIVE PASSWORD — id='\$idEntry' type=\$inputType depth=\$depth " +
                    "hints=[\${hints.joinToString()}] " +
                    "byHint=\$isPasswordByHint byType=\$isPasswordByType byAttr=\$isPasswordByAttr")
            }
            recurseChildren(node, form, depth); return
        }

        val isUsernameByHint = hints.any { it in NATIVE_USERNAME_HINTS }
        val isUsernameByAttr = USERNAME_ID_FRAGMENTS.any { f ->
            idEntry.contains(f) || contentDesc.contains(f) || hintText.contains(f)
        }

        if (isEditText && (isUsernameByHint || isUsernameByAttr)) {
            if (form.usernameNodes.isEmpty()) {
                form.usernameNodes.add(node)
                Log.d(TAG, "[PARSE] NATIVE USERNAME — id='\$idEntry' type=\$inputType depth=\$depth " +
                    "hints=[\${hints.joinToString()}] " +
                    "byHint=\$isUsernameByHint byAttr=\$isUsernameByAttr")
            }
        }

        recurseChildren(node, form, depth)
    }

    private fun recurseChildren(
        node: AssistStructure.ViewNode,
        form: ParsedForm,
        depth: Int
    ) {
        for (i in 0 until node.childCount) {
            traverseNode(node.getChildAt(i), form, depth + 1)
        }
    }

    // ── STRATEGY 5: Proximity heuristic ──────────────────────────────────────
    //
    //  If a password field was found but no username (e.g. step-2 "enter password"
    //  screen, or minimal WebView forms), walk backwards up to 10 nodes for the
    //  nearest focusable text field and treat it as the username slot.
    //
    private fun applyProximityHeuristic(form: ParsedForm) {
        val pwdNode = form.passwordNodes.firstOrNull() ?: return
        val pwdIdx  = form.allNodes.indexOf(pwdNode).takeIf { it > 0 } ?: return

        for (i in pwdIdx - 1 downTo maxOf(0, pwdIdx - 10)) {
            val candidate = form.allNodes[i]
            val cls = candidate.className?.lowercase() ?: ""
            if (candidate.autofillId != null &&
                candidate.autofillId != pwdNode.autofillId &&
                (cls.contains("edittext") || candidate.isFocusable) &&
                (candidate.inputType and InputType.TYPE_CLASS_TEXT) != 0
            ) {
                form.usernameNodes.add(candidate)
                Log.d(TAG, "[PARSE] PROXIMITY heuristic — id='\${candidate.idEntry}' " +
                    "is \${pwdIdx - i} node(s) before password field")
                break
            }
        }
    }

    // ─── Dataset Builder ───────────────────────────────────────────────────────

    private fun buildDataset(
        cred: Credential,
        form: ParsedForm,
        request: FillRequest,
        index: Int
    ): Dataset {
        val presentation = buildPresentation("SecureVaultX: \${cred.username}")
        val datasetBuilder = Dataset.Builder(presentation)

        form.usernameNodes.forEach { node ->
            node.autofillId?.let {
                datasetBuilder.setValue(it, AutofillValue.forText(cred.username), buildPresentation(cred.username))
                Log.v(TAG, "[FILL] Mapped username → autofillId=\$it")
            }
        }
        form.passwordNodes.forEach { node ->
            node.autofillId?.let {
                datasetBuilder.setValue(it, AutofillValue.forText(cred.password), buildPresentation("••••••••"))
                Log.v(TAG, "[FILL] Mapped password → autofillId=\$it")
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            tryBuildInlinePresentation(request, cred, index)?.let { inline ->
                val targetId = form.usernameNodes.firstOrNull()?.autofillId
                    ?: form.passwordNodes.firstOrNull()?.autofillId
                targetId?.let {
                    try {
                        datasetBuilder.setValue(
                            it,
                            AutofillValue.forText(cred.username),
                            buildPresentation(cred.username),
                            inline
                        )
                        Log.d(TAG, "[INLINE] Inline suggestion attached index=\$index")
                    } catch (e: Exception) {
                        Log.w(TAG, "[INLINE] setValue with inline failed: \${e.message}")
                    }
                }
            }
        }

        return datasetBuilder.build()
    }

    @RequiresApi(Build.VERSION_CODES.R)
    private fun tryBuildInlinePresentation(
        request: FillRequest,
        cred: Credential,
        index: Int
    ): android.widget.inline.InlinePresentation? {
        return try {
            val specs = request.inlineSuggestionsRequest?.inlinePresentationSpecs
            if (specs.isNullOrEmpty()) {
                Log.v(TAG, "[INLINE] No InlinePresentationSpec in request")
                return null
            }
            val spec = if (index < specs.size) specs[index] else specs.last()
            val pendingIntent = PendingIntent.getActivity(
                this, index,
                Intent(this, Class.forName("\$packageName.MainActivity")),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            val slice = androidx.autofill.inline.v1.InlineSuggestionUi
                .newContentBuilder(pendingIntent)
                .apply {
                    setTitle(cred.username)
                    setSubtitle("SecureVaultX")
                }
                .build().slice
            android.widget.inline.InlinePresentation(slice, spec, false)
        } catch (e: Exception) {
            Log.w(TAG, "[INLINE] Build failed: \${e.message}")
            null
        }
    }

    // ─── Save Info ─────────────────────────────────────────────────────────────

    private fun buildSaveInfo(form: ParsedForm): SaveInfo? {
        val ids = (form.usernameNodes + form.passwordNodes).mapNotNull { it.autofillId }
        if (ids.isEmpty()) {
            Log.d(TAG, "[SAVE] No valid AutofillIds for SaveInfo")
            return null
        }
        val saveType = when {
            form.usernameNodes.isNotEmpty() && form.passwordNodes.isNotEmpty() ->
                SaveInfo.SAVE_DATA_TYPE_USERNAME or SaveInfo.SAVE_DATA_TYPE_PASSWORD
            form.passwordNodes.isNotEmpty() -> SaveInfo.SAVE_DATA_TYPE_PASSWORD
            else -> SaveInfo.SAVE_DATA_TYPE_USERNAME
        }
        return SaveInfo.Builder(saveType, ids.toTypedArray())
            .setFlags(SaveInfo.FLAG_SAVE_ON_ALL_VIEWS_INVISIBLE)
            .build()
    }

    // ─── Presentation ──────────────────────────────────────────────────────────

    private fun buildPresentation(text: String) =
        RemoteViews(packageName, android.R.layout.simple_list_item_1).apply {
            setTextViewText(android.R.id.text1, text)
        }

    // ─── Vault I/O ─────────────────────────────────────────────────────────────

    private fun getPrefs() = EncryptedSharedPreferences.create(
        this, PREFS_FILE,
        MasterKey.Builder(this).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private fun loadVault(): JSONObject = try {
        JSONObject(getPrefs().getString(PREFS_KEY, "{}") ?: "{}").also {
            Log.d(TAG, "[VAULT] Loaded — \${it.length()} site(s)")
        }
    } catch (e: Exception) {
        Log.e(TAG, "[ERROR] loadVault: \${e.message}", e); JSONObject()
    }

    private fun saveToVault(siteKey: String, username: String, password: String) {
        try {
            val prefs = getPrefs()
            val vault = JSONObject(prefs.getString(PREFS_KEY, "{}") ?: "{}")
            val arr = if (vault.has(siteKey)) vault.getJSONArray(siteKey) else JSONArray()
            var updated = false
            for (i in 0 until arr.length()) {
                val item = arr.getJSONObject(i)
                if (item.getString("username") == username) {
                    item.put("password", password)
                    item.put("updatedAt", System.currentTimeMillis())
                    updated = true; break
                }
            }
            if (!updated) arr.put(JSONObject().apply {
                put("username", username); put("password", password)
                put("createdAt", System.currentTimeMillis())
            })
            vault.put(siteKey, arr)
            prefs.edit().putString(PREFS_KEY, vault.toString()).apply()
            Log.i(TAG, "[VAULT] ✓ Vault persisted — total sites=\${vault.length()}")
        } catch (e: Exception) {
            Log.e(TAG, "[ERROR] saveToVault: \${e.message}", e)
        }
    }

    // ─── Credential Matching ───────────────────────────────────────────────────

    private fun matchCredentials(
        vault: JSONObject,
        siteKey: String,
        packageName: String,
        webDomain: String?
    ): List<Credential> {
        Log.d(TAG, "[MATCH] Searching — siteKey='\$siteKey' pkg='\$packageName' domain='\$webDomain'")

        // 1. Exact web domain
        if (webDomain != null && vault.has(webDomain)) {
            Log.d(TAG, "[MATCH] EXACT domain='\$webDomain'")
            return extractCredentials(vault.getJSONArray(webDomain))
        }
        // 2. Exact package name
        if (vault.has(packageName)) {
            Log.d(TAG, "[MATCH] EXACT package='\$packageName'")
            return extractCredentials(vault.getJSONArray(packageName))
        }
        // 3. Fuzzy normalised match
        val normTarget = normalise(webDomain ?: packageName)
        Log.d(TAG, "[MATCH] Fuzzy normalised target='\$normTarget'")
        val iter = vault.keys()
        while (iter.hasNext()) {
            val key     = iter.next()
            val normKey = normalise(key)
            if (normKey.length > 2 && (
                normTarget.contains(normKey) ||
                normKey.contains(normTarget) ||
                normalise(packageName).contains(normKey)
            )) {
                Log.d(TAG, "[MATCH] FUZZY key='\$key' normKey='\$normKey'")
                return extractCredentials(vault.getJSONArray(key))
            }
        }
        Log.d(TAG, "[MATCH] No match for '\$siteKey'")
        return emptyList()
    }

    private fun normalise(raw: String) = raw.lowercase()
        .replace(Regex("^https?://"), "")
        .replace(Regex("^www[.]"), "")
        .replace(Regex("[.](com|org|net|io|app|dev|co|uk|in)$"), "")
        .replace(Regex("[^a-z0-9]"), "")

    private fun extractCredentials(arr: JSONArray) = (0 until arr.length()).map {
        arr.getJSONObject(it).let { o ->
            Credential(o.getString("username"), o.getString("password"))
        }
    }

    // ─── Data ──────────────────────────────────────────────────────────────────

    data class Credential(val username: String, val password: String)

    inner class ParsedForm {
        var webDomain: String? = null
        var nodeCount: Int     = 0
        var webFieldsFound     = false
        val allNodes           = mutableListOf<AssistStructure.ViewNode>()
        val usernameNodes      = mutableListOf<AssistStructure.ViewNode>()
        val passwordNodes      = mutableListOf<AssistStructure.ViewNode>()
    }
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
//  KOTLIN: PasswordRepository.kt
// ═══════════════════════════════════════════════════════════════════════════════

const PASSWORD_REPOSITORY_KT = `package PACKAGE_NAME.autofill

import android.content.Context
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONArray
import org.json.JSONObject

/**
 * PasswordRepository
 *
 * Single source of truth for reading and writing credentials.
 * Shared between the AutofillService and the React Native bridge.
 * All I/O is encrypted with AES-256-GCM via EncryptedSharedPreferences.
 *
 * ADB tag: SecureVaultX  prefix: [VAULT]
 */
class PasswordRepository(private val context: Context) {

    companion object {
        private const val TAG = "SecureVaultX"
        private const val PREFS_FILE = "secure_vault_autofill_prefs"
        private const val PREFS_KEY  = "credentials"
    }

    private fun getPrefs() = EncryptedSharedPreferences.create(
        context,
        PREFS_FILE,
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private fun readVault(): JSONObject {
        return try {
            val raw = getPrefs().getString(PREFS_KEY, "{}") ?: "{}"
            JSONObject(raw)
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] readVault error: \${e.message}", e)
            JSONObject()
        }
    }

    private fun writeVault(vault: JSONObject) {
        try {
            getPrefs().edit().putString(PREFS_KEY, vault.toString()).apply()
            Log.d(TAG, "[VAULT] writeVault — \${vault.length()} site(s) persisted")
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] writeVault error: \${e.message}", e)
        }
    }

    /** Save or update a credential. Returns true on success. */
    fun saveCredential(siteKey: String, username: String, password: String): Boolean {
        Log.d(TAG, "[VAULT] saveCredential site='\$siteKey' user='\$username'")
        return try {
            val vault = readVault()
            val arr = if (vault.has(siteKey)) vault.getJSONArray(siteKey) else JSONArray()

            var updated = false
            for (i in 0 until arr.length()) {
                val item = arr.getJSONObject(i)
                if (item.getString("username") == username) {
                    item.put("password", password)
                    item.put("updatedAt", System.currentTimeMillis())
                    updated = true
                    break
                }
            }
            if (!updated) {
                arr.put(JSONObject().apply {
                    put("username", username)
                    put("password", password)
                    put("createdAt", System.currentTimeMillis())
                })
            }
            vault.put(siteKey, arr)
            writeVault(vault)
            Log.i(TAG, "[VAULT] ✓ Saved credential for site='\$siteKey' (updated=\$updated)")
            true
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] saveCredential error: \${e.message}", e)
            false
        }
    }

    /** Get all credentials for a site as a JSON string. */
    fun getCredentials(siteKey: String): String {
        Log.d(TAG, "[VAULT] getCredentials site='\$siteKey'")
        return try {
            val vault = readVault()
            if (vault.has(siteKey)) {
                val arr = vault.getJSONArray(siteKey)
                Log.d(TAG, "[VAULT] Found \${arr.length()} credential(s) for '\$siteKey'")
                arr.toString()
            } else {
                Log.d(TAG, "[VAULT] No credentials found for '\$siteKey'")
                "[]"
            }
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] getCredentials error: \${e.message}", e)
            "[]"
        }
    }

    /** Delete one credential by username for a site. */
    fun deleteCredential(siteKey: String, username: String): Boolean {
        Log.d(TAG, "[VAULT] deleteCredential site='\$siteKey' user='\$username'")
        return try {
            val vault = readVault()
            if (!vault.has(siteKey)) {
                Log.w(TAG, "[VAULT] deleteCredential — site '\$siteKey' not found")
                return false
            }
            val arr = vault.getJSONArray(siteKey)
            val newArr = JSONArray()
            var found = false
            for (i in 0 until arr.length()) {
                val item = arr.getJSONObject(i)
                if (item.getString("username") == username) {
                    found = true
                    Log.d(TAG, "[VAULT] Removed credential user='\$username' from '\$siteKey'")
                } else {
                    newArr.put(item)
                }
            }
            vault.put(siteKey, newArr)
            writeVault(vault)
            found
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] deleteCredential error: \${e.message}", e)
            false
        }
    }

    /** Delete all credentials for a site. */
    fun deleteSite(siteKey: String): Boolean {
        Log.d(TAG, "[VAULT] deleteSite site='\$siteKey'")
        return try {
            val vault = readVault()
            if (vault.has(siteKey)) {
                vault.remove(siteKey)
                writeVault(vault)
                Log.i(TAG, "[VAULT] ✓ Deleted all credentials for '\$siteKey'")
                true
            } else {
                Log.w(TAG, "[VAULT] deleteSite — site '\$siteKey' not found")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] deleteSite error: \${e.message}", e)
            false
        }
    }

    /** Return a JSON string of all sites (keys only). */
    fun listSites(): String {
        return try {
            val vault = readVault()
            val arr = JSONArray()
            val keys = vault.keys()
            while (keys.hasNext()) arr.put(keys.next())
            Log.d(TAG, "[VAULT] listSites — \${arr.length()} site(s)")
            arr.toString()
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] listSites error: \${e.message}", e)
            "[]"
        }
    }

    /** Wipe the entire vault. */
    fun clearAll(): Boolean {
        return try {
            writeVault(JSONObject())
            Log.i(TAG, "[VAULT] ✓ Vault cleared")
            true
        } catch (e: Exception) {
            Log.e(TAG, "[VAULT] clearAll error: \${e.message}", e)
            false
        }
    }
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
//  KOTLIN: PasswordManagerModule.kt  (React Native Bridge)
// ═══════════════════════════════════════════════════════════════════════════════

const PASSWORD_MANAGER_MODULE_KT = `package PACKAGE_NAME.autofill

import android.util.Log
import com.facebook.react.bridge.*

/**
 * PasswordManagerModule
 *
 * React Native ↔ Native bridge. Exposed as NativeModules.PasswordManager in JS/TS.
 *
 * Available methods:
 *   saveCredential(site, username, password) → Promise<boolean>
 *   getCredentials(site)                     → Promise<string>   (JSON array)
 *   deleteCredential(site, username)         → Promise<boolean>
 *   deleteSite(site)                         → Promise<boolean>
 *   listSites()                              → Promise<string>   (JSON array)
 *   clearAll()                               → Promise<boolean>
 *
 * ADB tag: SecureVaultX  prefix: [BRIDGE]
 */
class PasswordManagerModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "SecureVaultX"
    }

    override fun getName() = "PasswordManager"

    private val repo get() = PasswordRepository(reactApplicationContext)

    @ReactMethod
    fun saveCredential(site: String, username: String, password: String, promise: Promise) {
        Log.d(TAG, "[BRIDGE] saveCredential site='\$site' user='\$username'")
        try {
            promise.resolve(repo.saveCredential(site, username, password))
        } catch (e: Exception) {
            Log.e(TAG, "[BRIDGE] saveCredential error: \${e.message}", e)
            promise.reject("SAVE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getCredentials(site: String, promise: Promise) {
        Log.d(TAG, "[BRIDGE] getCredentials site='\$site'")
        try {
            promise.resolve(repo.getCredentials(site))
        } catch (e: Exception) {
            Log.e(TAG, "[BRIDGE] getCredentials error: \${e.message}", e)
            promise.reject("GET_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun deleteCredential(site: String, username: String, promise: Promise) {
        Log.d(TAG, "[BRIDGE] deleteCredential site='\$site' user='\$username'")
        try {
            promise.resolve(repo.deleteCredential(site, username))
        } catch (e: Exception) {
            Log.e(TAG, "[BRIDGE] deleteCredential error: \${e.message}", e)
            promise.reject("DELETE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun deleteSite(site: String, promise: Promise) {
        Log.d(TAG, "[BRIDGE] deleteSite site='\$site'")
        try {
            promise.resolve(repo.deleteSite(site))
        } catch (e: Exception) {
            Log.e(TAG, "[BRIDGE] deleteSite error: \${e.message}", e)
            promise.reject("DELETE_SITE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun listSites(promise: Promise) {
        Log.d(TAG, "[BRIDGE] listSites")
        try {
            promise.resolve(repo.listSites())
        } catch (e: Exception) {
            Log.e(TAG, "[BRIDGE] listSites error: \${e.message}", e)
            promise.reject("LIST_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearAll(promise: Promise) {
        Log.d(TAG, "[BRIDGE] clearAll ⚠️")
        try {
            promise.resolve(repo.clearAll())
        } catch (e: Exception) {
            Log.e(TAG, "[BRIDGE] clearAll error: \${e.message}", e)
            promise.reject("CLEAR_ERROR", e.message, e)
        }
    }
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
//  KOTLIN: PasswordManagerPackage.kt
// ═══════════════════════════════════════════════════════════════════════════════

const PASSWORD_MANAGER_PACKAGE_KT = `package PACKAGE_NAME.autofill

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PasswordManagerPackage : ReactPackage {
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()

    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
        listOf(PasswordManagerModule(context))
}
`;

// ═══════════════════════════════════════════════════════════════════════════════
//  TYPESCRIPT: PasswordManager.ts  (JS-side API)
// ═══════════════════════════════════════════════════════════════════════════════

const PASSWORD_MANAGER_TS = `/**
 * PasswordManager.ts
 *
 * React Native JS/TS API for SecureVaultX.
 * Drop this file into your src/ directory.
 *
 * Usage:
 *   import { PasswordManager } from './PasswordManager';
 *
 *   await PasswordManager.save('github.com', 'alice@example.com', 'hunter2');
 *   const creds = await PasswordManager.get('github.com');
 *   const sites = await PasswordManager.listSites();
 *   await PasswordManager.deleteCredential('github.com', 'alice@example.com');
 *   await PasswordManager.deleteSite('github.com');
 *   await PasswordManager.clearAll();
 */

import { NativeModules, Platform } from 'react-native';

export interface Credential {
  username: string;
  password: string;
  createdAt?: number;
  updatedAt?: number;
}

const { PasswordManager: Native } = NativeModules;

function assertAndroid() {
  if (Platform.OS !== 'android') {
    throw new Error('PasswordManager native bridge is Android-only. Use expo-secure-store on iOS.');
  }
}

export const PasswordManager = {
  save(siteKey: string, username: string, password: string): Promise<boolean> {
    assertAndroid();
    return Native.saveCredential(siteKey, username, password);
  },

  async get(siteKey: string): Promise<Credential[]> {
    assertAndroid();
    const raw: string = await Native.getCredentials(siteKey);
    return JSON.parse(raw) as Credential[];
  },

  deleteCredential(siteKey: string, username: string): Promise<boolean> {
    assertAndroid();
    return Native.deleteCredential(siteKey, username);
  },

  deleteSite(siteKey: string): Promise<boolean> {
    assertAndroid();
    return Native.deleteSite(siteKey);
  },

  async listSites(): Promise<string[]> {
    assertAndroid();
    const raw: string = await Native.listSites();
    return JSON.parse(raw) as string[];
  },

  clearAll(): Promise<boolean> {
    assertAndroid();
    return Native.clearAll();
  },
};
`;

// ═══════════════════════════════════════════════════════════════════════════════
//  PLUGIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function withAndroidAutofill(config) {
  return withAndroidManifest(config, async (config) => {
    const packageName =
      config.android?.package ||
      config.android?.applicationId ||
      'com.pixelthread.securevaultx.dev';
    console.log(`[withPasswordManager] AndroidManifest — packageName: ${packageName}`);

    const manifest = config.modResults;
    const application = manifest.manifest.application[0];

    if (!application.service) application.service = [];

    const serviceName = `${packageName}.autofill.PasswordAutofillService`;
    const exists = application.service.some((s) => s['$']?.['android:name'] === serviceName);

    if (!exists) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:label': 'SecureVaultX Autofill',
          'android:permission': 'android.permission.BIND_AUTOFILL_SERVICE',
          'android:exported': 'true',
        },
        'intent-filter': [
          { action: [{ $: { 'android:name': 'android.service.autofill.AutofillService' } }] },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.autofill',
              'android:resource': '@xml/autofill_service',
            },
          },
        ],
      });
      console.log(`[withPasswordManager] ✓ AutofillService registered: ${serviceName}`);
    } else {
      console.log(`[withPasswordManager] AutofillService already present — skipping`);
    }

    if (!manifest.manifest['uses-permission']) manifest.manifest['uses-permission'] = [];
    const perms = manifest.manifest['uses-permission'];
    const biometric = 'android.permission.USE_BIOMETRIC';
    if (!perms.some((p) => p['$']?.['android:name'] === biometric)) {
      perms.push({ $: { 'android:name': biometric } });
    }

    return config;
  });
}

function withAndroidNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const packageName =
        config.android?.package ||
        config.android?.applicationId ||
        'com.pixelthread.securevaultx.dev';
      const projectRoot = config.modRequest.projectRoot;

      console.log(`[withPasswordManager] Writing native files — package: ${packageName}`);

      // ── res/xml ──────────────────────────────────────────────────────────────
      const resDir = path.join(projectRoot, 'android/app/src/main/res/xml');
      fs.mkdirSync(resDir, { recursive: true });
      fs.writeFileSync(
        path.join(resDir, 'autofill_service.xml'),
        AUTOFILL_SERVICE_XML.replace(/PACKAGE_NAME/g, packageName),
      );
      console.log(`[withPasswordManager] ✓ autofill_service.xml written`);

      // ── Kotlin sources ───────────────────────────────────────────────────────
      const packagePath = packageName.replace(/\./g, '/');
      const javaDir = path.join(projectRoot, 'android/app/src/main/java', packagePath, 'autofill');
      fs.mkdirSync(javaDir, { recursive: true });

      const replace = (str) => str.replace(/PACKAGE_NAME/g, packageName);

      const files = {
        'PasswordAutofillService.kt': replace(PASSWORD_AUTOFILL_SERVICE_KT),
        'PasswordRepository.kt': replace(PASSWORD_REPOSITORY_KT),
        'PasswordManagerModule.kt': replace(PASSWORD_MANAGER_MODULE_KT),
        'PasswordManagerPackage.kt': replace(PASSWORD_MANAGER_PACKAGE_KT),
      };

      for (const [filename, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(javaDir, filename), content);
        console.log(`[withPasswordManager] ✓ ${filename} written`);
      }

      // ── TS bridge ────────────────────────────────────────────────────────────
      const tsDest = path.join(projectRoot, 'src');
      fs.mkdirSync(tsDest, { recursive: true });
      fs.writeFileSync(path.join(tsDest, 'PasswordManager.ts'), PASSWORD_MANAGER_TS);
      console.log(`[withPasswordManager] ✓ PasswordManager.ts written to src/`);

      return config;
    },
  ]);
}

function withPasswordManagerModuleRegistration(config) {
  return withMainApplication(config, (config) => {
    const packageName =
      config.android?.package ||
      config.android?.applicationId ||
      'com.pixelthread.securevaultx.dev';
    let content = config.modResults.contents;

    console.log(`[withPasswordManager] Patching MainApplication — package: ${packageName}`);

    const importLine = `import ${packageName}.autofill.PasswordManagerPackage`;
    if (!content.includes(importLine)) {
      content = content.replace(/^(package .+)$/m, `$1\n\n${importLine}`);
      console.log(`[withPasswordManager] ✓ Import injected`);
    }

    const addPackageLine = 'add(PasswordManagerPackage())';
    if (!content.includes(addPackageLine)) {
      const applyPattern = /PackageList\(this\)\.packages\.apply\s*\{\s*/;
      if (applyPattern.test(content)) {
        content = content.replace(
          applyPattern,
          `PackageList(this).packages.apply {\n              ${addPackageLine}\n              `,
        );
        console.log(`[withPasswordManager] ✓ Package registered via apply{} pattern`);
      } else {
        const getPackagesPattern = /override fun getPackages\(\).*?\{[\s\S]*?return/;
        if (getPackagesPattern.test(content)) {
          content = content.replace(getPackagesPattern, (match) =>
            match.replace('return', `add(${addPackageLine})\n      return`),
          );
          console.log(`[withPasswordManager] ✓ Package registered via getPackages() pattern`);
        } else {
          console.warn(
            `[withPasswordManager] ⚠ Could not find registration point in MainApplication`,
          );
        }
      }
    }

    config.modResults.contents = content;
    return config;
  });
}

function withAndroidSecurityCrypto(config) {
  return withAppBuildGradle(config, (config) => {
    let content = config.modResults.contents;

    if (!content.includes('security-crypto')) {
      content = content.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation "androidx.security:security-crypto:1.1.0-alpha06"\n    implementation "androidx.autofill:autofill:1.1.0"`,
      );
      console.log(`[withPasswordManager] ✓ security-crypto + autofill dependencies added`);
    }

    if (content.includes('minSdkVersion') && !content.includes('minSdkVersion 2')) {
      content = content.replace(/minSdkVersion\s+\d+/, 'minSdkVersion 26');
      console.log(`[withPasswordManager] ✓ minSdkVersion bumped to 26`);
    }

    config.modResults.contents = content;
    return config;
  });
}

function withIOSAppGroup(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.security.application-groups'] = [
      'group.com.pixelthread.securevaultx.dev.securevault',
    ];
    config.modResults['com.apple.developer.authentication-services.autofill-credential-provider'] =
      true;
    console.log(`[withPasswordManager] ✓ iOS entitlements set`);
    return config;
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const withPasswordManager = (config) => {
  config = withAndroidAutofill(config);
  config = withAndroidNativeFiles(config);
  config = withPasswordManagerModuleRegistration(config);
  config = withAndroidSecurityCrypto(config);
  config = withIOSAppGroup(config);
  return config;
};

module.exports = createRunOncePlugin(withPasswordManager, pkg.name, pkg.version);
