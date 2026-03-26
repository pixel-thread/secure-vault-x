package PACKAGE_NAME.autofill

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

    @ReactMethod fun syncVault(json: String, p: Promise) { p.resolve(true) }
    @ReactMethod fun clearVault(p: Promise) { p.resolve(true) }

    @ReactMethod fun resolveAutofill(username: String, password: String, p: Promise) {
        val activity = getCurrentActivity() ?: run { p.reject("ERR", "No activity"); return }
        val intent = activity.intent
        
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
        rv.setTextViewText(android.R.id.text1, "SecureVaultX: $username")
        val datasetBuilder = Dataset.Builder(rv)
        
        ids.forEach { id ->
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
            p.resolve(Arguments.createMap().apply { 
                putString("siteKey", intent.getStringExtra("siteKey")) 
            })
        } else p.resolve(null)
    }
}
