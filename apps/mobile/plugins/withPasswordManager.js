/**
 * ============================================================
 *  SecureVault X — Production-Grade Autofill Expo Plugin
 *  withPasswordManager.js
 * ============================================================
 */

const {
  withAndroidManifest,
  withAndroidStyles,
  withEntitlementsPlist,
  withDangerousMod,
  withMainApplication,
  withAppBuildGradle,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const pkg = { name: 'secure-vault-x-password-manager', version: '2.2.0' };

// ═══════════════════════════════════════════════════════════════════════════════
//  KOTLIN TEMPLATES
// ═══════════════════════════════════════════════════════════════════════════════

const AUTOFILL_SERVICE_XML =
  '<?xml version="1.0" encoding="utf-8"?>\n' +
  '<autofill-service\n' +
  '    xmlns:android="http://schemas.android.com/apk/res/android"\n' +
  '    android:settingsActivity="PACKAGE_NAME.MainActivity" />';

const PASSWORD_AUTOFILL_SERVICE_KT = `package PACKAGE_NAME.autofill

import android.app.PendingIntent
import android.app.assist.AssistStructure
import android.content.Intent
import java.util.ArrayList
import android.os.Build
import android.os.CancellationSignal
import android.service.autofill.*
import android.text.InputType
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import androidx.annotation.RequiresApi
import org.json.JSONArray
import org.json.JSONObject

class PasswordAutofillService : AutofillService() {

    companion object {
        private const val TAG = "SecureVaultX"
        private val PASSWORD_INPUT_TYPE_MASKS = listOf(
            InputType.TYPE_TEXT_VARIATION_PASSWORD,
            InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD,
            InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD,
            InputType.TYPE_NUMBER_VARIATION_PASSWORD
        )
        private val HTML_PASSWORD_TYPES = setOf("password")
        private val HTML_USERNAME_TYPES = setOf("email", "tel", "text", "search", "number", "url")
    }

    override fun onConnected() { super.onConnected(); Log.i(TAG, "[FILL] AutofillService CONNECTED") }
    override fun onDisconnected() { super.onDisconnected(); Log.i(TAG, "[FILL] AutofillService DISCONNECTED") }

    override fun onFillRequest(request: FillRequest, cancellationSignal: CancellationSignal, callback: FillCallback) {
        val structure = request.fillContexts.last().structure
        val clientPackage = structure.activityComponent.packageName
        Log.i(TAG, "[FILL] Request started (pkg=\$clientPackage, session=\${request.id})")

        try {
            val parsed = ParsedForm()
            for (i in 0 until structure.windowNodeCount) {
                structure.getWindowNodeAt(i)?.rootViewNode?.let { traverseNode(it, parsed, depth = 0) }
            }

            if (parsed.usernameNodes.isEmpty() && parsed.passwordNodes.isNotEmpty()) { applyProximityHeuristic(parsed) }

            if (parsed.usernameNodes.isEmpty() && parsed.passwordNodes.isEmpty()) { 
                callback.onSuccess(null); return 
            }

            val repo  = PasswordRepository(this)
            val vault = repo.getVault()
            val siteKey = parsed.webDomain ?: clientPackage
            val credentials = matchCredentials(vault, siteKey, clientPackage, parsed.webDomain)

            val responseBuilder = FillResponse.Builder()
            val pickerIntent = Intent(this, Class.forName("PACKAGE_NAME.MainActivity")).apply {
                action = "com.pixelthread.securevaultx.dev.ACTION_AUTOFILL_PICKER"
                putExtra("siteKey", siteKey)
                val uIds = ArrayList<AutofillId>(); parsed.usernameNodes.forEach { it.autofillId?.let { id -> uIds.add(id) } }
                val pIds = ArrayList<AutofillId>(); parsed.passwordNodes.forEach { it.autofillId?.let { id -> pIds.add(id) } }
                putParcelableArrayListExtra("usernameIds", uIds)
                putParcelableArrayListExtra("passwordIds", pIds)
            }

            if (credentials.isNotEmpty()) {
                credentials.forEachIndexed { index, cred ->
                    val presentation = buildPresentation(mask(cred.username))
                    val datasetBuilder = Dataset.Builder(presentation)
                    parsed.usernameNodes.forEach { it.autofillId?.let { id -> datasetBuilder.setValue(id, null) } }
                    parsed.passwordNodes.forEach { it.autofillId?.let { id -> datasetBuilder.setValue(id, null) } }
                    
                    val pendingIntent = PendingIntent.getActivity(this, 100 + index, pickerIntent, 
                        (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0) or PendingIntent.FLAG_UPDATE_CURRENT)
                    
                    datasetBuilder.setAuthentication(pendingIntent.intentSender)
                    responseBuilder.addDataset(datasetBuilder.build())
                }
            } else {
                val presentation = buildPresentation("SecureVaultX: Search Vault")
                val pendingIntent = PendingIntent.getActivity(this, 0, pickerIntent, 
                    (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0) or PendingIntent.FLAG_UPDATE_CURRENT)
                
                responseBuilder.setAuthentication(
                    (parsed.usernameNodes.mapNotNull { it.autofillId } + parsed.passwordNodes.mapNotNull { it.autofillId }).toTypedArray(),
                    pendingIntent.intentSender,
                    presentation
                )
            }

            buildSaveInfo(parsed)?.let { responseBuilder.setSaveInfo(it) }
            callback.onSuccess(responseBuilder.build())

        } catch (e: Exception) { 
            Log.e(TAG, "[ERROR] onFillRequest: \${e.message}")
            callback.onSuccess(null) 
        }
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) { callback.onSuccess() }

    private fun traverseNode(node: AssistStructure.ViewNode, form: ParsedForm, depth: Int) {
        form.allNodes.add(node)
        if (!node.webDomain.isNullOrBlank() && form.webDomain == null) { form.webDomain = node.webDomain }
        val autofillId = node.autofillId ?: run { recurseChildren(node, form, depth); return }
        val hints = node.autofillHints ?: emptyArray(); val className = node.className?.lowercase() ?:""; val inputType = node.inputType
        val isEditText = className.contains("edittext") || className.contains("textinputedittext") || (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) node.autofillType == View.AUTOFILL_TYPE_TEXT else false)
        
        var scoreUsername = 0; var scorePassword = 0
        if (node.htmlInfo != null) {
            val htmlAttrs = node.htmlInfo?.attributes?.associate { it.first.lowercase() to it.second.lowercase() } ?: emptyMap()
            val htmlType = htmlAttrs["type"] ?: "text"
            if (htmlType in HTML_PASSWORD_TYPES) scorePassword += 5
            if (htmlType in HTML_USERNAME_TYPES && scorePassword < 3) scoreUsername += 5
        }
        if (hints.any { it.lowercase().contains("password") } || (inputType != 0 && (inputType and InputType.TYPE_TEXT_VARIATION_PASSWORD != 0))) scorePassword += 3
        if (isEditText && scorePassword > 0 && scorePassword > scoreUsername) form.passwordNodes.add(node)
        else if (isEditText && scoreUsername > 0) form.usernameNodes.add(node)
        recurseChildren(node, form, depth)
    }

    private fun recurseChildren(node: AssistStructure.ViewNode, form: ParsedForm, depth: Int) {
        for (i in 0 until node.childCount) { traverseNode(node.getChildAt(i), form, depth + 1) }
    }

    private fun applyProximityHeuristic(form: ParsedForm) {
        val pwdNode = form.passwordNodes.firstOrNull() ?: return
        val pwdIdx = form.allNodes.indexOf(pwdNode).takeIf { it > 0 } ?: return
        for (i in pwdIdx - 1 downTo maxOf(0, pwdIdx - 10)) {
            val candidate = form.allNodes[i]
            if (candidate.autofillId != null && candidate.isFocusable) { form.usernameNodes.add(candidate); break }
        }
    }

    private fun buildPresentation(text: String): RemoteViews {
        val p = RemoteViews(packageName, android.R.layout.simple_list_item_1)
        p.setTextViewText(android.R.id.text1, text); return p
    }

    private fun buildSaveInfo(form: ParsedForm): SaveInfo? {
        val ids = (form.usernameNodes + form.passwordNodes).mapNotNull { it.autofillId }
        if (ids.isEmpty()) return null
        return SaveInfo.Builder(SaveInfo.SAVE_DATA_TYPE_PASSWORD, ids.toTypedArray()).build()
    }

    private fun matchCredentials(vault: JSONObject, siteKey: String, packageName: String, webDomain: String?): List<Credential> {
        val repo = PasswordRepository(this)
        val resultsJson = repo.getCredentials(webDomain ?: packageName)
        return try {
            val arr = JSONArray(resultsJson)
            val list = mutableListOf<Credential>()
            for (i in 0 until arr.length()) { val o = arr.getJSONObject(i); list.add(Credential(o.getString("username"), o.getString("password"))) }
            list
        } catch (e: Exception) { emptyList() }
    }

    private fun mask(s: String?): String = if (s == null || s.length <= 4) "****" else s.take(2) + "***" + s.takeLast(2)

    data class Credential(val username: String, val password: String)
    inner class ParsedForm { var webDomain: String? = null; val allNodes = mutableListOf<AssistStructure.ViewNode>(); val usernameNodes = mutableListOf<AssistStructure.ViewNode>(); val passwordNodes = mutableListOf<AssistStructure.ViewNode>() }
}
`;

const PASSWORD_REPOSITORY_KT = `package PACKAGE_NAME.autofill

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

object SharedVault {
    @Volatile var vault: JSONObject? = null
    @Volatile var lastAccessedAt: Long = 0
}

class PasswordRepository(private val context: Context) {
    companion object {
        private const val TAG = "SecureVaultX"
        fun normalise(raw: String): String {
            var s = raw.lowercase().trim()
            s = s.replace("https://", "").replace("http://", "").substringBefore("/")
            val common = listOf("com.", ".android", ".com", ".net", ".org", ".co.uk", "www.")
            common.forEach { s = s.replace(it, "") }
            val norm = s.replace(Regex("[^a-z0-9]"), "")
            Log.d(TAG, "[MATCH] normalise(\$raw) -> \$norm")
            return norm
        }
    }

    fun getVault(): JSONObject {
        val v = SharedVault.vault; if (v != null) { SharedVault.lastAccessedAt = System.currentTimeMillis(); return v }
        return JSONObject()
    }

    fun syncVault(json: String): Boolean { try { SharedVault.vault = JSONObject(json); SharedVault.lastAccessedAt = System.currentTimeMillis(); return true } catch (e: Exception) { return false } }
    fun clearVault(): Boolean { SharedVault.vault = null; return true }

    fun getCredentials(siteKey: String): String {
        try {
            Log.d(TAG, "[MATCH] getCredentials siteKey=\$siteKey")
            val v = getVault()
            if (v.has(siteKey)) return v.getJSONArray(siteKey).toString()
            
            val normT = normalise(siteKey)
            val it = v.keys()
            while (it.hasNext()) {
                val k = it.next() as String
                val normK = normalise(k)
                if (normK.contains(normT) || normT.contains(normK)) {
                    Log.i(TAG, "[MATCH] Found fuzzy match: \$k matching \$siteKey")
                    return v.getJSONArray(k).toString()
                }
            }
        } catch (e: Exception) {}
        return "[]"
    }
}
`;

const PASSWORD_MANAGER_MODULE_KT = `package PACKAGE_NAME.autofill

import android.app.Activity
import android.content.Intent
import android.view.autofill.AutofillManager
import android.service.autofill.Dataset
import android.util.Log
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import com.facebook.react.bridge.*

class PasswordManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "PasswordManager"
    private val repo get() = PasswordRepository(reactApplicationContext)

    @ReactMethod fun syncVault(json: String, p: Promise) { p.resolve(repo.syncVault(json)) }
    @ReactMethod fun clearVault(p: Promise) { p.resolve(repo.clearVault()) }
    @ReactMethod fun getCredentials(site: String, p: Promise) { p.resolve(repo.getCredentials(site)) }

    @ReactMethod fun resolveAutofill(username: String, password: String, p: Promise) {
        val activity = getCurrentActivity() ?: run { p.reject("ERR", "No activity"); return }
        val intent = activity.intent
        val uIds = intent.getParcelableArrayListExtra<AutofillId>("usernameIds")
        val pIds = intent.getParcelableArrayListExtra<AutofillId>("passwordIds")

        val rv = RemoteViews(reactApplicationContext.packageName, android.R.layout.simple_list_item_1)
        rv.setTextViewText(android.R.id.text1, "SecureVaultX: \$username")
        val datasetBuilder = Dataset.Builder(rv)
        
        uIds?.forEach { datasetBuilder.setValue(it, AutofillValue.forText(username)) }
        pIds?.forEach { datasetBuilder.setValue(it, AutofillValue.forText(password)) }

        val reply = Intent().apply { putExtra(AutofillManager.EXTRA_AUTHENTICATION_RESULT, datasetBuilder.build()) }
        activity.setResult(Activity.RESULT_OK, reply)
        activity.finish()
        p.resolve(true)
    }

    @ReactMethod fun cancelAutofill(p: Promise) {
        val activity = getCurrentActivity() ?: run { p.reject("ERR", "No activity"); return }
        activity.setResult(Activity.RESULT_CANCELED)
        activity.finish()
        p.resolve(true)
    }

    @ReactMethod fun getAutofillContext(p: Promise) {
        val intent = getCurrentActivity()?.intent
        if (intent?.action == "com.pixelthread.securevaultx.dev.ACTION_AUTOFILL_PICKER") {
            p.resolve(Arguments.createMap().apply { putString("siteKey", intent.getStringExtra("siteKey")) })
        } else p.resolve(null)
    }
}
`;

const PASSWORD_MANAGER_PACKAGE_KT = `package PACKAGE_NAME.autofill
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PasswordManagerPackage : ReactPackage {
    override fun createViewManagers(c: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
    override fun createNativeModules(c: ReactApplicationContext): List<NativeModule> = listOf(PasswordManagerModule(c))
}
`;

const PASSWORD_MANAGER_TS =
  "import { NativeModules, Platform } from 'react-native';\n" +
  'const { PasswordManager: Native } = NativeModules;\n' +
  'export const PasswordManager = {\n' +
  '  syncVault: (sm) => Native.syncVault(JSON.stringify(sm)),\n' +
  '  clearVault: () => Native.clearVault(),\n' +
  '  get: (s) => Native.getCredentials(s).then(JSON.parse),\n' +
  '  resolveAutofill: (c) => Native.resolveAutofill(c.username, c.password),\n' +
  '  cancelAutofill: () => Native.cancelAutofill(),\n' +
  "  getAutofillContext: () => Platform.OS === 'android' ? Native.getAutofillContext() : Promise.resolve(null),\n" +
  '};';

// ═══════════════════════════════════════════════════════════════════════════════
//  PLUGIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function withAndroidAutofill(config) {
  return withAndroidManifest(config, async (config) => {
    const pkgName = config.android?.package || 'com.pixelthread.securevaultx.dev';
    const app = config.modResults.manifest.application[0];
    if (!app.service) app.service = [];

    const serviceName = pkgName + '.autofill.PasswordAutofillService';
    // Deep check to prevent duplicates
    const existing = app.service.findIndex((s) => s.$?.['android:name'] === serviceName);
    const serviceDef = {
      $: {
        'android:name': serviceName,
        'android:permission': 'android.permission.BIND_AUTOFILL_SERVICE',
        'android:exported': 'true',
      },
      'intent-filter': [
        { action: [{ $: { 'android:name': 'android.service.autofill.AutofillService' } }] },
      ],
      'meta-data': [
        { $: { 'android:name': 'android.autofill', 'android:resource': '@xml/autofill_service' } },
      ],
    };

    if (existing >= 0) app.service[existing] = serviceDef;
    else app.service.push(serviceDef);

    const mainActivity = app.activity.find((a) => a['$']?.['android:name'] === '.MainActivity');
    if (mainActivity) mainActivity['$']['android:theme'] = '@style/Theme.App.Translucent';
    return config;
  });
}

function withAndroidTranslucentTheme(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style;
    if (!styles.find((s) => s.$?.name === 'Theme.App.Translucent')) {
      styles.push({
        $: { name: 'Theme.App.Translucent', parent: 'Theme.AppCompat.Light.NoActionBar' },
        item: [
          { $: { name: 'android:windowIsTranslucent' }, _: 'true' },
          { $: { name: 'android:windowBackground' }, _: '@android:color/transparent' },
          { $: { name: 'android:windowSplashScreenBackground' }, _: '@android:color/transparent' },
        ],
      });
    }
    return config;
  });
}

function withAndroidNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const pkgName = config.android?.package || 'com.pixelthread.securevaultx.dev';
      const root = config.modRequest.projectRoot;

      // Resource XML
      const resDir = path.join(root, 'android/app/src/main/res/xml');
      fs.mkdirSync(resDir, { recursive: true });
      fs.writeFileSync(
        path.join(resDir, 'autofill_service.xml'),
        AUTOFILL_SERVICE_XML.replace(/PACKAGE_NAME/g, pkgName),
      );

      // Kotlin Files — Correct directory nesting
      const javaDir = path.join(
        root,
        'android/app/src/main/java',
        pkgName.split('.').join('/'),
        'autofill',
      );
      fs.mkdirSync(javaDir, { recursive: true });

      const rep = (s) => s.replace(/PACKAGE_NAME/g, pkgName);
      fs.writeFileSync(
        path.join(javaDir, 'PasswordAutofillService.kt'),
        rep(PASSWORD_AUTOFILL_SERVICE_KT),
      );
      fs.writeFileSync(path.join(javaDir, 'PasswordRepository.kt'), rep(PASSWORD_REPOSITORY_KT));
      fs.writeFileSync(
        path.join(javaDir, 'PasswordManagerModule.kt'),
        rep(PASSWORD_MANAGER_MODULE_KT),
      );
      fs.writeFileSync(
        path.join(javaDir, 'PasswordManagerPackage.kt'),
        rep(PASSWORD_MANAGER_PACKAGE_KT),
      );

      // Bridge TS
      fs.writeFileSync(path.join(root, 'src/PasswordManager.ts'), PASSWORD_MANAGER_TS);
      return config;
    },
  ]);
}

function withRegisterPackage(config) {
  return withMainApplication(config, (config) => {
    const pkgName = config.android?.package || 'com.pixelthread.securevaultx.dev';
    let c = config.modResults.contents;
    const imp = 'import ' + pkgName + '.autofill.PasswordManagerPackage';
    if (!c.includes(imp)) c = c.replace(/^(package .+)$/m, '$1\n\n' + imp);
    if (!c.includes('PasswordManagerPackage()')) {
      c = c.replace(
        /PackageList\(this\)\.packages\.apply\s*\{\s*/,
        'PackageList(this).packages.apply {\n              add(PasswordManagerPackage())\n              ',
      );
    }
    config.modResults.contents = c;
    return config;
  });
}

const withPasswordManager = (config) => {
  config = withAndroidAutofill(config);
  config = withAndroidTranslucentTheme(config);
  config = withAndroidNativeFiles(config);
  config = withRegisterPackage(config);
  config = withAppBuildGradle(config, (config) => {
    let c = config.modResults.contents;
    if (!c.includes('androidx.autofill'))
      c = c.replace(
        /dependencies\s*\{/,
        'dependencies {\n    implementation "androidx.autofill:autofill:1.1.0"',
      );
    config.modResults.contents = c;
    return config;
  });
  return config;
};

module.exports = createRunOncePlugin(withPasswordManager, pkg.name, pkg.version);
