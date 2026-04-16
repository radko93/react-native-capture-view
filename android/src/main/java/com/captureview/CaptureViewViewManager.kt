package com.captureview

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.CaptureViewViewManagerDelegate
import com.facebook.react.viewmanagers.CaptureViewViewManagerInterface

@ReactModule(name = CaptureViewViewManager.NAME)
class CaptureViewViewManager :
    ViewGroupManager<CaptureViewView>(),
    CaptureViewViewManagerInterface<CaptureViewView> {

    private val mDelegate = CaptureViewViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<CaptureViewView> = mDelegate

    override fun getName(): String = NAME

    override fun createViewInstance(context: ThemedReactContext): CaptureViewView {
        return CaptureViewView(context)
    }

    override fun capture(
        view: CaptureViewView?,
        callbackId: String?,
        format: String?,
        quality: String?,
        resultType: String?,
        snapshotContentContainer: Boolean,
    ) {
        if (view == null || callbackId == null) return
        view.capture(
            callbackId = callbackId,
            format = format ?: "png",
            quality = quality?.toDoubleOrNull() ?: 1.0,
            resultType = resultType ?: "tmpfile",
            fullContent = snapshotContentContainer,
        )
    }

    companion object {
        const val NAME = "CaptureViewView"
    }
}
