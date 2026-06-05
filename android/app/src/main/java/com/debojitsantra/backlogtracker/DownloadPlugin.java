package com.debojitsantra.backlogtracker;

import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "Download")
public class DownloadPlugin extends Plugin {

    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String filename = call.getString("filename");
        String data     = call.getString("data");
        String mimeType = call.getString("mimeType", "application/json");

        if (filename == null || filename.isEmpty()) {
            call.reject("Missing required parameter: filename");
            return;
        }
        if (data == null) {
            call.reject("Missing required parameter: data");
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                values.put(MediaStore.Downloads.IS_PENDING, 1);

                Uri uri = getContext().getContentResolver().insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);

                if (uri == null) {
                    call.reject("MediaStore returned null URI — cannot create file in Downloads");
                    return;
                }

                try (OutputStream os = getContext().getContentResolver().openOutputStream(uri)) {
                    if (os == null) {
                        call.reject("Could not open output stream for the Downloads URI");
                        return;
                    }
                    os.write(data.getBytes(StandardCharsets.UTF_8));
                    os.flush();
                }

                // mark the file as complete 
                values.clear();
                values.put(MediaStore.Downloads.IS_PENDING, 0);
                getContext().getContentResolver().update(uri, values, null, null);

                JSObject result = new JSObject();
                result.put("path", "Downloads/" + filename);
                call.resolve(result);

            } else {
                
                File downloadsDir = Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_DOWNLOADS);

                if (!downloadsDir.exists()) {
                    
                    downloadsDir.mkdirs();
                }

                File outFile = new File(downloadsDir, filename);
                try (FileOutputStream fos = new FileOutputStream(outFile)) {
                    fos.write(data.getBytes(StandardCharsets.UTF_8));
                    fos.flush();
                }

                JSObject result = new JSObject();
                result.put("path", outFile.getAbsolutePath());
                call.resolve(result);
            }

        } catch (Exception e) {
            call.reject("Failed to save file to Downloads: " + e.getMessage(), e);
        }
    }
}
