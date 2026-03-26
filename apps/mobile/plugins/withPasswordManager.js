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

const pkg = { name: 'secure-vault-x-password-manager', version: '2.6.2' };

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
import android.util.Log
import android.view.View
import android.view.autofill.AutofillId
import android.widget.RemoteViews

class PasswordAutofillService : AutofillService() {

    companion object {
        private const val TAG = "SecureVaultX"
    }

    override fun onFillRequest(request: FillRequest, cancellationSignal: CancellationSignal, callback: FillCallback) {
        val structure = request.fillContexts.last().structure
        val clientPackage = structure.activityComponent.packageName
        Log.i(TAG, "[FILL] Lazy Request (pkg=\$clientPackage)")

        try {
            val parsed = ParsedForm()
            for (i in 0 until structure.windowNodeCount) {
                structure.getWindowNodeAt(i)?.rootViewNode?.let { traverseNode(it, parsed) }
            }

            if (parsed.autofillIds.isEmpty()) { 
                callback.onSuccess(null); return 
            }

            val siteKey = parsed.webDomain ?: clientPackage
            
            // Unified Picker Intent
            val pickerIntent = Intent(this, Class.forName("PACKAGE_NAME.MainActivity")).apply {
                action = "com.pixelthread.securevaultx.dev.ACTION_AUTOFILL_PICKER"
                putExtra("siteKey", siteKey)
                putParcelableArrayListExtra("autofillIds", ArrayList(parsed.autofillIds))
            }

            val pendingIntent = PendingIntent.getActivity(this, 1000, pickerIntent, 
                (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0) or PendingIntent.FLAG_UPDATE_CURRENT)
            
            // Single "SecureVaultX" Dataset that launches the Picker
            val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1).apply {
                setTextViewText(android.R.id.text1, "SecureVault X")
            }

            val responseBuilder = FillResponse.Builder()
            val datasetBuilder = Dataset.Builder(presentation)
            
            // Map all detected fields to the picker
            parsed.autofillIds.forEach { datasetBuilder.setValue(it, null) }
            datasetBuilder.setAuthentication(pendingIntent.intentSender)
            
            responseBuilder.addDataset(datasetBuilder.build())
            callback.onSuccess(responseBuilder.build())

        } catch (e: Exception) { 
            Log.e(TAG, "[ERROR] onFillRequest: \${e.message}")
            callback.onSuccess(null) 
        }
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) { callback.onSuccess() }

    private fun traverseNode(node: AssistStructure.ViewNode, form: ParsedForm) {
        val autofillId = node.autofillId
        // FIXED: USE .visibility == View.VISIBLE instead of non-existent .isVisible
        if (autofillId != null && node.isEnabled && node.visibility == View.VISIBLE) {
            val hints = node.autofillHints?.toList() ?: emptyList()
            val className = node.className?.lowercase() ?: ""
            
            // Detect login-related fields
            if (className.contains("edittext") || className.contains("textinput") || hints.isNotEmpty()) {
                form.autofillIds.add(autofillId)
            }
        }
        
        if (!node.webDomain.isNullOrBlank() && form.webDomain == null) { 
            form.webDomain = node.webDomain 
        }
        
        for (i in 0 until node.childCount) { 
            traverseNode(node.getChildAt(i), form) 
        }
    }

    inner class ParsedForm { 
        var webDomain: String? = null
        val autofillIds = mutableListOf<AutofillId>() 
    }
}
`;

const PASSWORD_MANAGER_MODULE_KT = `package PACKAGE_NAME.autofill

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.view.autofill.AutofillManager
import android.service.autofill.Dataset
import android.util.Log
import android.view.autofill.AutofillId
import android.view.autofill.AutofillValue
import android.widget.RemoteViews
import com.facebook.react.bridge.*
import java.util.ArrayList

class PasswordManagerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "PasswordManager"

    companion object {
        private const val TAG = "SecureVaultX"
    }

    @ReactMethod fun syncVault(json: String, p: Promise) { p.resolve(true) } // No-op
    @ReactMethod fun clearVault(p: Promise) { p.resolve(true) } // No-op
    @ReactMethod fun getCredentials(site: String, p: Promise) { p.resolve("[]") } // No-op

    @ReactMethod fun resolveAutofill(username: String, password: String, p: Promise) {
        val activity = getCurrentActivity() ?: run { p.reject("ERR", "No activity"); return }
        val intent = activity.intent
        
        // Final Fix for Parcelable Retrieval
        @Suppress("DEPRECATION")
        val ids: ArrayList<AutofillId>? = if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableArrayListExtra("autofillIds", AutofillId::class.java)
        } else {
            intent.getParcelableArrayListExtra("autofillIds")
        }

        if (ids == null) {
            Log.e(TAG, "[ERROR] Missing autofillIds in intent")
            p.reject("ERR", "Missing metadata")
            return
        }

        val rv = RemoteViews(reactApplicationContext.packageName, android.R.layout.simple_list_item_1)
        rv.setTextViewText(android.R.id.text1, "SecureVaultX: \$username")
        val datasetBuilder = Dataset.Builder(rv)
        
        ids.forEach { id ->
            // Use index to distinguish username/password fields roughly if many
            val index = ids.indexOf(id)
            val value = if (index == 0) username else password
            datasetBuilder.setValue(id, AutofillValue.forText(value))
        }

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

const PASSWORD_MANAGER_TS = `import { NativeModules, Platform } from 'react-native';

const { PasswordManager: Native } = NativeModules;

export interface Credential {
  username: string;
  password?: string;
}

export const PasswordManager = {
  syncVault: (sm: any) => Promise.resolve(true),
  clearVault: () => Promise.resolve(true),
  get: (s: string): Promise<Credential[]> => Promise.resolve([]),
  resolveAutofill: (c: Credential) => Native.resolveAutofill(c.username, c.password),
  cancelAutofill: () => Native.cancelAutofill(),
  getAutofillContext: (): Promise<{ siteKey: string } | null> =>
    Platform.OS === 'android' ? Native.getAutofillContext() : Promise.resolve(null),
};`;

// ═══════════════════════════════════════════════════════════════════════════════
//  PLUGIN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function withAndroidAutofill(config) {
  return withAndroidManifest(config, async (config) => {
    const pkgName = config.android?.package || 'com.pixelthread.securevaultx.dev';
    const app = config.modResults.manifest.application[0];
    if (!app.service) app.service = [];

    const serviceName = pkgName + '.autofill.PasswordAutofillService';
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

    const existing = app.service.findIndex((s) => s.$?.['android:name'] === serviceName);
    if (existing >= 0) app.service[existing] = serviceDef;
    else app.service.push(serviceDef);

    const mainActivity = app.activity.find((a) => a['$']?.['android:name'] === '.MainActivity');
    if (mainActivity) {
      mainActivity['$']['android:theme'] = '@style/Theme.App.Translucent';
      mainActivity['$']['android:launchMode'] = 'singleTask';
    }
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

      const resDir = path.join(root, 'android/app/src/main/res/xml');
      fs.mkdirSync(resDir, { recursive: true });
      fs.writeFileSync(
        path.join(resDir, 'autofill_service.xml'),
        AUTOFILL_SERVICE_XML.replace(/PACKAGE_NAME/g, pkgName),
      );

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
      fs.writeFileSync(
        path.join(javaDir, 'PasswordManagerModule.kt'),
        rep(PASSWORD_MANAGER_MODULE_KT),
      );
      fs.writeFileSync(
        path.join(javaDir, 'PasswordManagerPackage.kt'),
        rep(PASSWORD_MANAGER_PACKAGE_KT),
      );

      const utilsDir = path.join(root, 'src/utils');
      fs.mkdirSync(utilsDir, { recursive: true });
      fs.writeFileSync(path.join(utilsDir, 'PasswordManager.ts'), PASSWORD_MANAGER_TS);
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
