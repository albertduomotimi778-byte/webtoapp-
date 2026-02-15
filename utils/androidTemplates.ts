

import { AppPermissions } from "../types";

export const getAndroidManifest = (packageName: string, appName: string, permissions: AppPermissions) => `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    
    <!-- Storage Permissions -->
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" tools:ignore="ScopedStorage" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    ${permissions.camera ? '<uses-permission android:name="android.permission.CAMERA" />' : ''}
    ${permissions.microphone ? '<uses-permission android:name="android.permission.RECORD_AUDIO" />' : ''}
    ${permissions.location ? '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />' : ''}
    ${permissions.location ? '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />' : ''}
    
    ${permissions.screenRecording ? '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />' : ''}
    ${permissions.screenRecording ? '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION" />' : ''}

    ${permissions.alarmReminders ? '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />' : ''}
    ${permissions.alarmReminders ? '<uses-permission android:name="android.permission.VIBRATE" />' : ''}
    ${permissions.alarmReminders ? '<uses-permission android:name="com.android.alarm.permission.SET_ALARM" />' : ''}

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${appName}"
        android:hardwareAccelerated="true"
        android:supportsRtl="true"
        android:requestLegacyExternalStorage="true"
        android:usesCleartextTraffic="true"
        android:theme="@style/Theme.App">
        
        <activity
            android:name="${packageName}.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>`;

export const getStyles = (color: string) => `<resources>
    <style name="Theme.App" parent="android:Theme.DeviceDefault.NoActionBar">
        <item name="android:statusBarColor">${color}</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowFullscreen">true</item>
    </style>
</resources>`;

export const getMainActivity = (packageName: string, url: string, permissions: AppPermissions, isPremium: boolean, appName: string) => `package ${packageName};

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.view.Gravity;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.TranslateAnimation;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.LinearLayout;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.DownloadListener;
import android.webkit.URLUtil;
import android.webkit.PermissionRequest;
import android.webkit.JavascriptInterface;
import android.webkit.ServiceWorkerController;
import android.webkit.ServiceWorkerClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.net.Uri;
import android.content.Intent;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.net.NetworkInfo;
import android.app.Dialog;
import android.content.SharedPreferences;
import android.app.DownloadManager;
import android.os.Environment;
import android.os.Build;
import android.widget.Toast;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {

    private WebView myWebView;
    private FrameLayout rootLayout;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    
    private static final String TARGET_URL = "${url}";
    private static final String APP_NAME = "${appName}";
    
    // File Upload Variables
    private ValueCallback<Uri> mUploadMessage;
    public ValueCallback<Uri[]> uploadMessage;
    public static final int REQUEST_SELECT_FILE = 100;
    private final static int FILECHOOSER_RESULTCODE = 1;

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void share(String title, String text, String url) {
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            sendIntent.putExtra(Intent.EXTRA_TEXT, (text + " " + url).trim());
            sendIntent.putExtra(Intent.EXTRA_TITLE, title);
            sendIntent.setType("text/plain");
            mContext.startActivity(Intent.createChooser(sendIntent, "Share"));
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // --- IMMERSIVE MODE INIT ---
        hideSystemUI();
        
        // --- LAYOUT INIT ---
        rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#020408"));
        
        myWebView = new WebView(this);
        myWebView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
        
        rootLayout.addView(myWebView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 
            ViewGroup.LayoutParams.MATCH_PARENT
        ));
        
        // --- WATERMARK (NON-PREMIUM ONLY) ---
        ${!isPremium ? `
        TextView watermark = new TextView(this);
        watermark.setText("⚡ Built with Web2App Instant");
        watermark.setTextColor(Color.WHITE);
        watermark.setTextSize(10f);
        watermark.setTypeface(Typeface.DEFAULT_BOLD);
        watermark.setPadding(30, 15, 30, 15);
        GradientDrawable shape = new GradientDrawable();
        shape.setCornerRadius(50);
        shape.setColor(Color.parseColor("#99000000"));
        shape.setStroke(2, Color.parseColor("#4f46e5"));
        watermark.setBackground(shape);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        params.setMargins(0, 0, 0, 60);
        watermark.animate().alpha(0.0f).setDuration(1000).setStartDelay(8000);
        rootLayout.addView(watermark, params);
        ` : ''}

        setContentView(rootLayout);

        setupWebView();
        setupOfflineCapability();
        
        if (savedInstanceState == null) {
            myWebView.loadUrl(TARGET_URL);
        } else {
            myWebView.restoreState(savedInstanceState);
        }
    }

    private void setupWebView() {
        WebSettings webSettings = myWebView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        String userAgent = webSettings.getUserAgentString();
        webSettings.setUserAgentString(userAgent.replace("; wv", ""));
        
        // --- PERFORMANCE SETTINGS ---
        // Removed deprecated AppCache methods.
        webSettings.setAllowFileAccess(true);
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        
        // --- SERVICE WORKER SUPPORT (PWA OFFLINE) ---
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                        return super.shouldInterceptRequest(request);
                    }
                });
            } catch (Exception e) {
                // Ignore service worker errors on unsupported devices
            }
        }
        
        ${permissions.popups ? 'webSettings.setSupportMultipleWindows(true);' : 'webSettings.setSupportMultipleWindows(false);'}
        ${permissions.popups ? 'webSettings.setJavaScriptCanOpenWindowsAutomatically(true);' : 'webSettings.setJavaScriptCanOpenWindowsAutomatically(false);'}
        
        webSettings.setAllowContentAccess(true);
        
        // Add Javascript Interface
        myWebView.addJavascriptInterface(new WebAppInterface(this), "WebToApp");
        
        // Handle Downloads
        myWebView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                try {
                    DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
                    request.setMimeType(mimetype);
                    String cookies = CookieManager.getInstance().getCookie(url);
                    request.addRequestHeader("cookie", cookies);
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setDescription("Downloading file...");
                    String fileName = URLUtil.guessFileName(url, contentDisposition, mimetype);
                    request.setTitle(fileName);
                    request.allowScanningByMediaScanner();
                    request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                    request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
                    DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    dm.enqueue(request);
                    Toast.makeText(getApplicationContext(), "Downloading...", Toast.LENGTH_LONG).show();
                } catch (Exception e) {
                    Toast.makeText(getApplicationContext(), "Download Failed", Toast.LENGTH_SHORT).show();
                }
            }
        });

        // Initial Cache State
        updateCacheMode(isNetworkAvailable());
        
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(myWebView, true);

        myWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url == null) return false;
                if (url.startsWith("http://") || url.startsWith("https://")) return false;
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) { return true; }
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                // Inject Polyfill for navigator.share to use native share sheet
                view.evaluateJavascript("navigator.share = function(data) { window.WebToApp.share(data.title || '', data.text || '', data.url || ''); return Promise.resolve(); };", null);
            }
        });
        
        myWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) { request.grant(request.getResources()); }
            public boolean onShowFileChooser(WebView mWebView, ValueCallback<Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                if (uploadMessage != null) { uploadMessage.onReceiveValue(null); uploadMessage = null; }
                uploadMessage = filePathCallback;
                Intent intent = fileChooserParams.createIntent();
                try { startActivityForResult(intent, REQUEST_SELECT_FILE); } catch (Exception e) { uploadMessage = null; return false; }
                return true;
            }
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                final WebView newWebView = new WebView(view.getContext());
                newWebView.getSettings().setJavaScriptEnabled(true);
                newWebView.getSettings().setSupportMultipleWindows(true);
                newWebView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
                final Dialog dialog = new Dialog(view.getContext(), android.R.style.Theme_Black_NoTitleBar_Fullscreen);
                dialog.setContentView(newWebView);
                dialog.show();
                newWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        return false;
                    }
                });
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(newWebView);
                resultMsg.sendToTarget();
                return true;
            }
        });
    }

    private void setupOfflineCapability() {
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            networkCallback = new ConnectivityManager.NetworkCallback() {
                @Override
                public void onAvailable(Network network) {
                    runOnUiThread(() -> updateCacheMode(true));
                }

                @Override
                public void onLost(Network network) {
                    runOnUiThread(() -> updateCacheMode(false));
                }
            };
            connectivityManager.registerDefaultNetworkCallback(networkCallback);
        }
    }

    private void updateCacheMode(boolean isOnline) {
        if (myWebView == null) return;
        WebSettings settings = myWebView.getSettings();
        if (isOnline) {
             // ONLINE: Load from network, but use cache if headers allow (Standard behavior)
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        } else {
            // OFFLINE: Force cache usage. "Instant Loading"
            // This loads resources from the cache even if they have expired.
            settings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
        }
    }

    private void hideSystemUI() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
            View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
            View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_FULLSCREEN);
    }

    private boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm.getActiveNetworkInfo();
        return info != null && info.isConnected();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (connectivityManager != null && networkCallback != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            connectivityManager.unregisterNetworkCallback(networkCallback);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQUEST_SELECT_FILE) {
            if (uploadMessage == null) return;
            uploadMessage.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            uploadMessage = null;
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        if (myWebView.canGoBack()) myWebView.goBack();
        else super.onBackPressed();
    }
}`;

export const getBuildGradle = (packageName: string) => `plugins {
    id 'com.android.application'
}

android {
    namespace '${packageName}'
    compileSdk 33
    defaultConfig {
        applicationId "${packageName}"
        minSdk 24
        targetSdk 33
        versionCode 1
        versionName "1.0"
    }
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    
    lintOptions {
        checkReleaseBuilds false
        abortOnError false
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}`;

export const getGithubWorkflow = (appName: string) => `name: Build Android APK

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Setup Gradle
      uses: gradle/gradle-build-action@v2
      with:
        gradle-version: '8.1.1'

    - name: Build with Gradle
      run: gradle assembleDebug --no-daemon

    - name: Upload APK
      uses: actions/upload-artifact@v4
      with:
        name: ${appName.replace(/\s+/g, '-')}-APK
        path: app/build/outputs/apk/debug/app-debug.apk
`;
