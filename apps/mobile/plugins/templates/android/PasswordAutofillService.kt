package PACKAGE_NAME.autofill

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
        Log.i(TAG, "[FILL] Request for package: $clientPackage")

        try {
            val parsed = ParsedForm()
            for (i in 0 until structure.windowNodeCount) {
                structure.getWindowNodeAt(i)?.rootViewNode?.let { traverseNode(it, parsed) }
            }

            if (parsed.autofillIds.isEmpty()) { 
                callback.onSuccess(null)
                return 
            }

            val siteKey = parsed.webDomain ?: clientPackage
            
            // Unified Picker Intent - Launch MainActivity with special action
            val pickerIntent = Intent(this, Class.forName("PACKAGE_NAME.MainActivity")).apply {
                action = "com.pixelthread.securevaultx.dev.ACTION_AUTOFILL_PICKER"
                putExtra("siteKey", siteKey)
                putParcelableArrayListExtra("autofillIds", ArrayList(parsed.autofillIds))
            }

            val pendingIntent = PendingIntent.getActivity(
                this, 
                1000, 
                pickerIntent, 
                (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) PendingIntent.FLAG_MUTABLE else 0) or PendingIntent.FLAG_UPDATE_CURRENT
            )
            
            // "SecureVault X" Dataset that launches the Picker
            val presentation = RemoteViews(packageName, android.R.layout.simple_list_item_1).apply {
                setTextViewText(android.R.id.text1, "SecureVault X")
            }

            val responseBuilder = FillResponse.Builder()
            val datasetBuilder = Dataset.Builder(presentation)
            
            // Map detected IDs to the picker trigger
            parsed.autofillIds.forEach { datasetBuilder.setValue(it, null) }
            datasetBuilder.setAuthentication(pendingIntent.intentSender)
            
            responseBuilder.addDataset(datasetBuilder.build())
            callback.onSuccess(responseBuilder.build())

        } catch (e: Exception) { 
            Log.e(TAG, "[ERROR] onFillRequest: ${e.message}")
            callback.onSuccess(null) 
        }
    }

    override fun onSaveRequest(request: SaveRequest, callback: SaveCallback) { callback.onSuccess() }

    private fun traverseNode(node: AssistStructure.ViewNode, form: ParsedForm) {
        val autofillId = node.autofillId
        // Visibility check ensures we only pick active fields
        if (autofillId != null && node.isEnabled && node.visibility == View.VISIBLE) {
            val hints = node.autofillHints?.toList() ?: emptyList()
            val className = node.className?.lowercase() ?: ""
            
            // Detect login-related fields via className hints or metadata
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
