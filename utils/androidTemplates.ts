

import { AppPermissions, MonetizationSettings } from "../types";

export const getAndroidManifest = (packageName: string, appName: string, permissions: AppPermissions, monetization: MonetizationSettings) => `<?xml version="1.0" encoding="utf-8"?>
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
        
        ${monetization.enabled ? `
        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="${monetization.appId}"/>
        ` : ''}

        <activity
            android:name="${packageName}.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <receiver android:name="${packageName}.NotificationReceiver" android:exported="false">
            <intent-filter>
                <action android:name="com.webtoapp.EXPIRED" />
            </intent-filter>
        </receiver>

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

export const getNotificationReceiver = (packageName: string, appName: string) => `package ${packageName};

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class NotificationReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        Toast.makeText(context, "${appName} subscription has expired.", Toast.LENGTH_LONG).show();
    }
}
`;

export const getMainActivity = (packageName: string, url: string, permissions: AppPermissions, isPremium: boolean, monetization: MonetizationSettings, appName: string) => `package ${packageName};

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

${monetization.enabled ? `
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.AdSize;
` : ''}

public class MainActivity extends Activity {

    private WebView myWebView;
    private FrameLayout rootLayout;
    private FrameLayout lockedContainer;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;
    
    private static final String TARGET_URL = "${url}";
    private static final String APP_NAME = "${appName}";
    
    // IAP Config
    private static final boolean IAP_ENABLED = ${monetization.iapEnabled};
    private static final String IAP_MODE = "${monetization.iapMode}"; 
    private static final String IAP_PLAN = "${monetization.subscriptionPlan}"; 
    private static final String DISPLAY_PRICE = "${monetization.displayPrice}";
    private static final String STORE_URL = "${monetization.storeUrl}";
    private static final String SUCCESS_URL = "${monetization.successUrl}";

    // File Upload Variables
    private ValueCallback<Uri> mUploadMessage;
    public ValueCallback<Uri[]> uploadMessage;
    public static final int REQUEST_SELECT_FILE = 100;
    private final static int FILECHOOSER_RESULTCODE = 1;

    ${monetization.enabled ? 'private AdView mAdView;' : ''}
    
    private boolean isCurrentlyLocked = false;
    private Handler expiryCheckHandler = new Handler(Looper.getMainLooper());
    private Runnable expiryCheckRunnable;

    public class WebAppInterface {
        Context mContext;

        WebAppInterface(Context c) {
            mContext = c;
        }

        @JavascriptInterface
        public void lock() {
            // Trigger the lock UI from JavaScript
            runOnUiThread(() -> {
                if (!isCurrentlyLocked) {
                     showOfferStage();
                     lockedContainer.setVisibility(View.VISIBLE);
                     isCurrentlyLocked = true;
                }
            });
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

        ${monetization.enabled && monetization.bannerId ? `
        // --- ADMOB BANNER SETUP ---
        try {
            MobileAds.initialize(this, initializationStatus -> {});
            mAdView = new AdView(this);
            mAdView.setAdSize(AdSize.BANNER);
            mAdView.setAdUnitId("${monetization.bannerId}");
            FrameLayout.LayoutParams adParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, 
                FrameLayout.LayoutParams.WRAP_CONTENT
            );
            adParams.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
            rootLayout.addView(mAdView, adParams);
            AdRequest adRequest = new AdRequest.Builder().build();
            mAdView.loadAd(adRequest);
            myWebView.setPadding(0, 0, 0, 150);
        } catch (Exception e) {}
        ` : ''}

        // --- LOCKED APP VIEW SETUP ---
        initLockedUI();
        
        // If "Locked App" mode is selected, show it immediately on start
        if (IAP_ENABLED && IAP_MODE.equals("locked_app")) {
             checkSubscriptionStatus();
        }

        setContentView(rootLayout);

        setupWebView();
        setupOfflineCapability();
        
        if (savedInstanceState == null) {
            myWebView.loadUrl(TARGET_URL);
        } else {
            myWebView.restoreState(savedInstanceState);
        }

        if (IAP_ENABLED) {
            startExpiryChecker();
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
        
        // --- OFFLINE & PERFORMANCE CACHE SETTINGS ---
        File cacheDir = new File(getCacheDir(), "app_cache");
        if (!cacheDir.exists()) cacheDir.mkdirs();
        webSettings.setAppCachePath(cacheDir.getAbsolutePath());
        webSettings.setAppCacheEnabled(true); // Legacy Support
        webSettings.setAllowFileAccess(true);
        webSettings.setRenderPriority(WebSettings.RenderPriority.HIGH);
        
        // --- SERVICE WORKER SUPPORT (PWA OFFLINE) ---
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                    return super.shouldInterceptRequest(request);
                }
            });
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
                if (IAP_ENABLED) checkSubscriptionStatus();
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
                        if (IAP_ENABLED && SUCCESS_URL.length() > 0 && url != null && url.contains(SUCCESS_URL)) {
                            dialog.dismiss();
                            handlePurchaseSuccess();
                            return true;
                        }
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

    // --- PREMIUM UI SUITE ---

    private void initLockedUI() {
        lockedContainer = new FrameLayout(this);
        lockedContainer.setBackgroundColor(Color.parseColor("#0F1115"));
        lockedContainer.setVisibility(View.GONE);
        rootLayout.addView(lockedContainer, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
        ));
        // Don't show immediately unless in locked_app mode logic
    }

    private void showOfferStage() {
        lockedContainer.removeAllViews();
        
        // Wrapper FrameLayout to overlay Close Button
        FrameLayout wrapper = new FrameLayout(this);
        wrapper.setLayoutParams(new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        
        // --- CONTENT LAYOUT ---
        LinearLayout layout = createBaseLayout();
        
        TextView title = new TextView(this);
        title.setText("Unlock " + APP_NAME + " Pro");
        title.setTextColor(Color.WHITE);
        title.setTextSize(28);
        title.setTypeface(null, Typeface.BOLD);
        title.setGravity(Gravity.CENTER);
        layout.addView(title);
        
        TextView sub = new TextView(this);
        sub.setText("Access premium features and remove restrictions.");
        sub.setTextColor(Color.parseColor("#94a3b8"));
        sub.setTextSize(14);
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(60, 20, 60, 60);
        layout.addView(sub);
        
        // Use custom DISPLAY_PRICE here
        Button btn = createPrimaryButton("SUBSCRIBE NOW (" + DISPLAY_PRICE + ")");
        btn.setOnClickListener(v -> startPaymentFlow());
        layout.addView(btn);
        
        wrapper.addView(layout);
        
        // --- CLOSE BUTTON ---
        // Only show close button if it's triggered via JS or if we allow exiting the lock
        Button closeBtn = new Button(this);
        closeBtn.setText("✕");
        closeBtn.setTextColor(Color.parseColor("#94a3b8"));
        closeBtn.setBackgroundColor(Color.TRANSPARENT);
        closeBtn.setTextSize(24);
        closeBtn.setPadding(20, 20, 20, 20);
        
        FrameLayout.LayoutParams closeParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, 
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        closeParams.gravity = Gravity.TOP | Gravity.END;
        closeParams.setMargins(0, 50, 30, 0); // 50 margin for status bar area
        closeBtn.setLayoutParams(closeParams);
        
        closeBtn.setOnClickListener(v -> unlockApp());
        
        wrapper.addView(closeBtn);
        
        lockedContainer.addView(wrapper);
    }

    private void showProcessingStage() {
        lockedContainer.removeAllViews();
        LinearLayout layout = createBaseLayout();
        
        ProgressBar pb = new ProgressBar(this);
        layout.addView(pb);
        
        TextView msg = new TextView(this);
        msg.setText("Initiating Secure Gateway...");
        msg.setTextColor(Color.WHITE);
        msg.setPadding(0, 40, 0, 0);
        msg.setGravity(Gravity.CENTER);
        layout.addView(msg);
        
        lockedContainer.addView(layout);
        
        new Handler(Looper.getMainLooper()).postDelayed(this::openMerchantWindow, 2000);
    }

    private void showSuccessStage() {
        lockedContainer.removeAllViews();
        LinearLayout layout = createBaseLayout();
        
        TextView check = new TextView(this);
        check.setText("✓");
        check.setTextColor(Color.parseColor("#10b981"));
        check.setTextSize(80);
        check.setTypeface(null, Typeface.BOLD);
        layout.addView(check);
        
        TextView msg = new TextView(this);
        msg.setText("Payment Confirmed!");
        msg.setTextColor(Color.WHITE);
        msg.setTextSize(22);
        msg.setPadding(0, 20, 0, 0);
        layout.addView(msg);
        
        lockedContainer.addView(layout);
        new Handler(Looper.getMainLooper()).postDelayed(this::showFinalStage, 3000);
    }

    private void showFinalStage() {
        lockedContainer.removeAllViews();
        LinearLayout layout = createBaseLayout();
        
        SharedPreferences prefs = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        long expiry = prefs.getLong("expiry_ts", 0);
        String dateStr = new SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(new Date(expiry));
        
        TextView title = new TextView(this);
        title.setText("Welcome to Pro");
        title.setTextColor(Color.WHITE);
        title.setTextSize(26);
        title.setTypeface(null, Typeface.BOLD);
        layout.addView(title);
        
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackground(createRoundedRect("#15171C", 30));
        card.setPadding(60, 60, 60, 60);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        cp.setMargins(60, 40, 60, 60);
        card.setLayoutParams(cp);
        
        card.addView(createKeyValueRow("Plan Type", IAP_PLAN.toUpperCase()));
        card.addView(createKeyValueRow("Status", "ACTIVE"));
        card.addView(createKeyValueRow("Expires On", dateStr));
        
        layout.addView(card);
        
        Button btn = createPrimaryButton("CONTINUE TO APP");
        btn.setOnClickListener(v -> unlockApp());
        layout.addView(btn);
        
        lockedContainer.addView(layout);
    }

    private LinearLayout createKeyValueRow(String key, String val) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(0, 10, 0, 10);
        TextView k = new TextView(this); k.setText(key); k.setTextColor(Color.parseColor("#64748b")); k.setTextSize(12); k.setLayoutParams(new LinearLayout.LayoutParams(0, -2, 1));
        TextView v = new TextView(this); v.setText(val); v.setTextColor(Color.WHITE); v.setTextSize(12); v.setTypeface(null, Typeface.BOLD);
        row.addView(k); row.addView(v);
        return row;
    }

    private LinearLayout createBaseLayout() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setGravity(Gravity.CENTER);
        l.setLayoutParams(new FrameLayout.LayoutParams(-1, -1));
        AlphaAnimation anim = new AlphaAnimation(0f, 1f); anim.setDuration(500); l.startAnimation(anim);
        return l;
    }

    private Button createPrimaryButton(String text) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextColor(Color.BLACK);
        b.setTypeface(null, Typeface.BOLD);
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.WHITE);
        gd.setCornerRadius(20);
        b.setBackground(gd);
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(-1, 140);
        p.setMargins(80, 20, 80, 20);
        b.setLayoutParams(p);
        return b;
    }

    private GradientDrawable createRoundedRect(String color, int radius) {
        GradientDrawable gd = new GradientDrawable();
        gd.setColor(Color.parseColor(color));
        gd.setCornerRadius(radius);
        return gd;
    }

    // --- LOGIC GATE ---

    private void startPaymentFlow() {
        showProcessingStage();
    }

    private void openMerchantWindow() {
        final WebView paymentWebView = new WebView(this);
        paymentWebView.getSettings().setJavaScriptEnabled(true);
        paymentWebView.getSettings().setDomStorageEnabled(true);
        final Dialog dialog = new Dialog(this, android.R.style.Theme_Black_NoTitleBar_Fullscreen);
        dialog.setContentView(paymentWebView);
        paymentWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && url.contains(SUCCESS_URL)) {
                    dialog.dismiss();
                    handlePurchaseSuccess();
                    return true;
                }
                return false;
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                if (url != null && url.contains(SUCCESS_URL)) {
                    dialog.dismiss();
                    handlePurchaseSuccess();
                }
            }
        });
        dialog.show();
        paymentWebView.loadUrl(STORE_URL);
    }

    private void handlePurchaseSuccess() {
        long now = System.currentTimeMillis();
        long duration = IAP_PLAN.equals("yearly") ? (365L * 24 * 60 * 60 * 1000L) : (30L * 24 * 60 * 60 * 1000L);
        long expiry = now + duration;
        
        SharedPreferences prefs = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        prefs.edit()
            .putBoolean("is_premium", true)
            .putLong("expiry_ts", expiry)
            .apply();
        
        injectJSStatus(true);
        runOnUiThread(this::showSuccessStage);
    }

    private void checkSubscriptionStatus() {
        if (!IAP_ENABLED) return;
        SharedPreferences prefs = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        boolean isPremium = prefs.getBoolean("is_premium", false);
        long expiry = prefs.getLong("expiry_ts", 0);
        
        boolean isValid = isPremium && System.currentTimeMillis() < expiry;
        
        injectJSStatus(isValid);

        if (isValid) {
            unlockApp();
        } else {
            if (isPremium) handleExpiration();
            if (IAP_MODE.equals("locked_app")) {
                lockApp();
            }
        }
    }

    private void startExpiryChecker() {
        expiryCheckRunnable = new Runnable() {
            @Override
            public void run() {
                checkSubscriptionStatus();
                expiryCheckHandler.postDelayed(this, 10000); // Check every 10s
            }
        };
        expiryCheckHandler.post(expiryCheckRunnable);
    }

    private void handleExpiration() {
        SharedPreferences prefs = getSharedPreferences("AppPrefs", MODE_PRIVATE);
        prefs.edit().clear().apply();
        injectJSStatus(false);
        runOnUiThread(() -> {
            Toast.makeText(this, "Subscription Expired", Toast.LENGTH_LONG).show();
            // showOfferStage(); - Handled by lockApp if needed, or user action
        });
    }

    private void lockApp() {
        if (isCurrentlyLocked) return;
        isCurrentlyLocked = true;
        runOnUiThread(() -> {
            showOfferStage(); // Ensure layout is built with current state
            lockedContainer.setVisibility(View.VISIBLE);
            myWebView.setVisibility(View.GONE);
        });
    }

    private void unlockApp() {
        isCurrentlyLocked = false;
        runOnUiThread(() -> {
            lockedContainer.setVisibility(View.GONE);
            myWebView.setVisibility(View.VISIBLE);
        });
    }

    private void injectJSStatus(boolean isPremium) {
        String js;
        if (isPremium) {
            js = "window.isNativeAppPremium = true; window.onNativePremiumActive = true; window.dispatchEvent(new Event('native-premium-active'));";
        } else {
            js = "window.isNativeAppPremium = false; delete window.onNativePremiumActive; window.dispatchEvent(new Event('native-premium-expired'));";
        }
        final String runJs = js;
        runOnUiThread(() -> {
             if (myWebView != null) myWebView.evaluateJavascript(runJs, null);
        });
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
        if (isCurrentlyLocked) return; // Disable back button when locked
        if (myWebView.canGoBack()) myWebView.goBack();
        else super.onBackPressed();
    }
}`;

export const getBuildGradle = (packageName: string, monetization: MonetizationSettings) => `plugins {
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
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.9.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    ${monetization.enabled ? "implementation 'com.google.android.gms:play-services-ads:22.5.0'" : ""}
}`;

export const getGithubWorkflow = (appName: string) => `name: Build Android App
on:
  push:
    branches: [ "main" ]
  workflow_dispatch:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    - uses: gradle/actions/setup-gradle@v3
      with:
        gradle-version: '8.4'
    - run: gradle assembleDebug
    - uses: actions/upload-artifact@v4
      with:
        name: ${appName.replace(/\s+/g, '-')}-APK
        path: app/build/outputs/apk/debug/app-debug.apk
`;
