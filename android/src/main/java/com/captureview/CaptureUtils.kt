package com.captureview

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.util.Base64
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

object CaptureUtils {

    fun compressAndResolve(
        context: Context,
        bitmap: Bitmap,
        callbackId: String,
        format: String,
        quality: Double,
        resultType: String,
        captureWidth: Int,
        captureHeight: Int,
    ) {
        Thread {
            try {
                val compressFormat = if (format == "jpg") Bitmap.CompressFormat.JPEG else Bitmap.CompressFormat.PNG
                val qualityInt = (quality * 100).toInt()

                val resultMap = mutableMapOf<String, Any>(
                    "width" to captureWidth.toDouble(),
                    "height" to captureHeight.toDouble(),
                    "format" to format,
                )

                if (resultType == "base64") {
                    val baos = ByteArrayOutputStream()
                    bitmap.compress(compressFormat, qualityInt, baos)
                    resultMap["base64"] = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
                } else {
                    val file = writeTempFile(context, bitmap, compressFormat, qualityInt, format)
                    resultMap["uri"] = android.net.Uri.fromFile(file).toString()
                }

                bitmap.recycle()
                CaptureModule.resolveCapture(callbackId, resultMap)
            } catch (e: Exception) {
                bitmap.recycle()
                CaptureModule.rejectCapture(callbackId, "E_COMPRESS_FAILED", e.message ?: "Compression failed")
            }
        }.start()
    }

    fun drawTextureViews(view: View, canvas: Canvas, offsetX: Int, offsetY: Int) {
        if (view is TextureView && view.visibility == View.VISIBLE) {
            val tvBitmap = view.bitmap ?: return
            canvas.save()
            canvas.translate((offsetX + view.left).toFloat(), (offsetY + view.top).toFloat())
            canvas.drawBitmap(tvBitmap, 0f, 0f, null)
            canvas.restore()
        }
        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                val child = view.getChildAt(i)
                drawTextureViews(child, canvas, offsetX + view.left, offsetY + view.top)
            }
        }
    }

    fun writeTempFile(context: Context, bitmap: Bitmap, format: Bitmap.CompressFormat, quality: Int, ext: String): File {
        val dir = File(context.cacheDir, "CaptureView")
        dir.mkdirs()
        val file = File(dir, "${UUID.randomUUID()}.$ext")
        FileOutputStream(file).use { bitmap.compress(format, quality, it) }
        return file
    }
}
