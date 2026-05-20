package com.autotracker.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

import java.io.File;

@CapacitorPlugin(
    name = "ApkInstaller",
    permissions = {
        @Permission(
            strings = { "android.permission.REQUEST_INSTALL_PACKAGES" },
            alias = "installPackages"
        )
    }
)
public class ApkInstallerPlugin extends Plugin {

    private static final int INSTALL_REQUEST_CODE = 1234;

    @PluginMethod
    public void canRequestInstall(PluginCall call) {
        boolean canRequest = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            canRequest = getActivity().getPackageManager().canRequestPackageInstalls();
        } else {
            canRequest = true;
        }
        JSObject result = new JSObject();
        result.put("canRequest", canRequest);
        call.resolve(result);
    }

    @PluginMethod
    public void requestInstallPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getActivity().getPackageName()));
                startActivityForResult(call, intent, INSTALL_REQUEST_CODE);
            } catch (Exception e) {
                // Fallback: open settings page
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                    startActivityForResult(call, intent, INSTALL_REQUEST_CODE);
                } catch (Exception ex) {
                    call.reject("Cannot open install permission settings: " + ex.getMessage());
                }
            }
        } else {
            call.resolve(new JSObject().put("granted", true));
        }
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null || filePath.isEmpty()) {
            call.reject("filePath is required");
            return;
        }

        try {
            File file = new File(filePath);
            if (!file.exists()) {
                call.reject("APK file not found: " + filePath);
                return;
            }

            // Check if we can request install on Android 8+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!getActivity().getPackageManager().canRequestPackageInstalls()) {
                    call.reject("INSTALL_PERMISSION_REQUIRED");
                    return;
                }
            }

            Uri apkUri = FileProvider.getUriForFile(
                getActivity(),
                getActivity().getPackageName() + ".fileprovider",
                file
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            getActivity().startActivity(intent);

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to install APK: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == INSTALL_REQUEST_CODE) {
            PluginCall savedCall = getSavedCall();
            if (savedCall != null) {
                boolean canRequest = true;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    canRequest = getActivity().getPackageManager().canRequestPackageInstalls();
                }
                JSObject result = new JSObject();
                result.put("granted", canRequest);
                savedCall.resolve(result);
            }
        }
    }
}
