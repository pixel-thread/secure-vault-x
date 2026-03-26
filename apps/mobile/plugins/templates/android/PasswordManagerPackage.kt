package PACKAGE_NAME.autofill

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class PasswordManagerPackage : ReactPackage {
    override fun createViewManagers(c: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
    override fun createNativeModules(c: ReactApplicationContext): List<NativeModule> = listOf(PasswordManagerModule(c))
}
