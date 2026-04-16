package com.captureview

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.view.View
import android.view.ViewGroup
import android.widget.ScrollView

class CaptureViewView(context: Context) : ViewGroup(context) {

    override fun onLayout(changed: Boolean, l: Int, t: Int, r: Int, b: Int) {
        // Fabric handles child layout — no-op
    }

    override fun requestDisallowInterceptTouchEvent(disallowIntercept: Boolean) {
        parent?.requestDisallowInterceptTouchEvent(disallowIntercept)
    }

    fun capture(
        callbackId: String,
        format: String,
        quality: Double,
        resultType: String,
        fullContent: Boolean = false,
    ) {
        if (fullContent) {
            captureScrollContent(callbackId, format, quality, resultType)
        } else {
            captureViewport(callbackId, format, quality, resultType)
        }
    }

    private fun captureViewport(
        callbackId: String,
        format: String,
        quality: Double,
        resultType: String,
    ) {
        val captureWidth = width
        val captureHeight = height

        if (captureWidth <= 0 || captureHeight <= 0) {
            CaptureModule.rejectCapture(callbackId, "E_INVALID_SIZE",
                "View has zero dimensions (${captureWidth}x${captureHeight})")
            return
        }

        val maxPixels = 4096L * 4096L
        if (captureWidth.toLong() * captureHeight.toLong() > maxPixels) {
            CaptureModule.rejectCapture(callbackId, "E_BITMAP_TOO_LARGE",
                "Capture dimensions too large (${captureWidth}x${captureHeight})")
            return
        }

        try {
            val bitmap = Bitmap.createBitmap(captureWidth, captureHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            draw(canvas)
            CaptureUtils.drawTextureViews(this, canvas, 0, 0)
            CaptureUtils.compressAndResolve(context, bitmap, callbackId, format, quality, resultType, captureWidth, captureHeight)
        } catch (e: OutOfMemoryError) {
            CaptureModule.rejectCapture(callbackId, "E_OOM", "Out of memory creating bitmap")
        } catch (e: Exception) {
            CaptureModule.rejectCapture(callbackId, "E_CAPTURE_FAILED", e.message ?: "Capture failed")
        }
    }

    private fun captureScrollContent(
        callbackId: String,
        format: String,
        quality: Double,
        resultType: String,
    ) {
        val scrollView = findScrollView(this)
        if (scrollView == null) {
            CaptureModule.rejectCapture(callbackId, "E_NO_SCROLL",
                "fullContent requires a ScrollView child")
            return
        }

        val contentView = scrollView.getChildAt(0)
        if (contentView == null) {
            CaptureModule.rejectCapture(callbackId, "E_NO_CONTENT",
                "ScrollView has no content")
            return
        }

        val captureWidth = contentView.width
        val captureHeight = contentView.height

        if (captureWidth <= 0 || captureHeight <= 0) {
            CaptureModule.rejectCapture(callbackId, "E_INVALID_SIZE",
                "Scroll content has zero dimensions (${captureWidth}x${captureHeight})")
            return
        }

        val maxPixels = 4096L * 4096L
        if (captureWidth.toLong() * captureHeight.toLong() > maxPixels) {
            CaptureModule.rejectCapture(callbackId, "E_BITMAP_TOO_LARGE",
                "Capture dimensions too large (${captureWidth}x${captureHeight})")
            return
        }

        try {
            val bitmap = Bitmap.createBitmap(captureWidth, captureHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            // Draw the content child directly — no scroll state mutation
            contentView.draw(canvas)
            CaptureUtils.drawTextureViews(contentView, canvas, 0, 0)
            CaptureUtils.compressAndResolve(context, bitmap, callbackId, format, quality, resultType, captureWidth, captureHeight)
        } catch (e: OutOfMemoryError) {
            CaptureModule.rejectCapture(callbackId, "E_OOM", "Out of memory creating bitmap")
        } catch (e: Exception) {
            CaptureModule.rejectCapture(callbackId, "E_CAPTURE_FAILED", e.message ?: "Capture failed")
        }
    }

    private fun findScrollView(view: ViewGroup): ScrollView? {
        for (i in 0 until view.childCount) {
            val child = view.getChildAt(i)
            if (child is ScrollView) return child
            if (child is ViewGroup) {
                val nested = findScrollView(child)
                if (nested != null) return nested
            }
        }
        return null
    }
}
