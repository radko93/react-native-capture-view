package com.captureview

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class CaptureViewPackage : BaseReactPackage() {

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return listOf(CaptureViewViewManager())
    }

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            CaptureModule.NAME -> CaptureModule(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            CaptureModule.NAME to ReactModuleInfo(
                CaptureModule.NAME,
                CaptureModule.NAME,
                false,
                false,
                false,
                true,
            )
        )
    }
}
