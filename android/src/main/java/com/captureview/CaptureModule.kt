package com.captureview

import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@ReactModule(name = CaptureModule.NAME)
class CaptureModule(private val reactContext: ReactApplicationContext) :
    NativeCaptureModuleSpec(reactContext) {

    companion object {
        const val NAME = "NativeCaptureModule"

        private val pendingResolve = ConcurrentHashMap<String, (Map<String, Any?>) -> Unit>()
        private val pendingReject = ConcurrentHashMap<String, (String, String) -> Unit>()

        fun resolveCapture(callbackId: String, result: Map<String, Any?>) {
            pendingResolve.remove(callbackId)?.invoke(result)
            pendingReject.remove(callbackId)
        }

        fun rejectCapture(callbackId: String, code: String, message: String) {
            pendingReject.remove(callbackId)?.invoke(code, message)
            pendingResolve.remove(callbackId)
        }
    }

    override fun getName(): String = NAME

    override fun waitForCapture(callbackId: String, promise: Promise) {
        pendingResolve[callbackId] = { result ->
            val map = WritableNativeMap().apply {
                for ((key, value) in result) {
                    when (value) {
                        is String -> putString(key, value)
                        is Double -> putDouble(key, value)
                        is Int -> putInt(key, value)
                        is Boolean -> putBoolean(key, value)
                        null -> putNull(key)
                    }
                }
            }
            promise.resolve(map)
        }
        pendingReject[callbackId] = { code, message ->
            promise.reject(code, message)
        }
    }

    override fun captureScreen(options: ReadableMap, promise: Promise) {
        val format = if (options.hasKey("format")) options.getString("format") ?: "png" else "png"
        val quality = if (options.hasKey("quality")) options.getDouble("quality") else 1.0
        val resultType = if (options.hasKey("result")) options.getString("result") ?: "tmpfile" else "tmpfile"

        reactContext.runOnUiQueueThread {
            val activity = currentActivity
            if (activity == null) {
                promise.reject("E_NO_ACTIVITY", "No current activity")
                return@runOnUiQueueThread
            }

            val decorView = activity.window.decorView
            val w = decorView.width
            val h = decorView.height

            if (w <= 0 || h <= 0) {
                promise.reject("E_INVALID_SIZE", "DecorView has zero dimensions")
                return@runOnUiQueueThread
            }

            try {
                val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)
                decorView.draw(canvas)

                Thread {
                    try {
                        val compressFormat = if (format == "jpg") Bitmap.CompressFormat.JPEG else Bitmap.CompressFormat.PNG
                        val qualityInt = (quality * 100).toInt()

                        val map = WritableNativeMap().apply {
                            putDouble("width", w.toDouble())
                            putDouble("height", h.toDouble())
                            putString("format", format)
                        }

                        if (resultType == "base64") {
                            val baos = ByteArrayOutputStream()
                            bitmap.compress(compressFormat, qualityInt, baos)
                            map.putString("base64", Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP))
                        } else {
                            val file = writeTempFile(bitmap, compressFormat, qualityInt, format)
                            map.putString("uri", android.net.Uri.fromFile(file).toString())
                        }

                        bitmap.recycle()
                        promise.resolve(map)
                    } catch (e: Exception) {
                        bitmap.recycle()
                        promise.reject("E_CAPTURE_FAILED", e.message ?: "Capture failed")
                    }
                }.start()
            } catch (e: OutOfMemoryError) {
                promise.reject("E_OOM", "Out of memory creating bitmap")
            }
        }
    }

    private fun writeTempFile(bitmap: Bitmap, format: Bitmap.CompressFormat, quality: Int, ext: String): File {
        val dir = File(reactContext.cacheDir, "CaptureView")
        dir.mkdirs()
        val file = File(dir, "${UUID.randomUUID()}.$ext")
        FileOutputStream(file).use { bitmap.compress(format, quality, it) }
        return file
    }
}
