

import { AppConfig, VirtualFile } from "../types";

export const getIosContentView = (url: string, isPremium: boolean, displayPrice: string) => `import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    let urlString: String

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        
        // --- CAPABILITY: POPUPS ---
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        
        // --- PAYMENT FIX: PERSISTENCE ---
        // Ensure Cookies share storage
        configuration.websiteDataStore = WKWebsiteDataStore.default()

        let webView = WKWebView(frame: .zero, configuration: configuration)
        
        // --- PAYMENT FIX: USER AGENT ---
        // Mimic Safari to avoid payment gateway rejection
        webView.customUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        
        // --- PAYMENT FIX: DELEGATE ---
        webView.navigationDelegate = context.coordinator

        if let url = URL(string: urlString) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebView

        init(_ parent: WebView) {
            self.parent = parent
        }
        
        // Ensure redirects and referrers are allowed
        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            decisionHandler(.allow)
        }
        
        // Handle popup windows by loading them in place (or handle properly)
        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil {
                webView.load(navigationAction.request)
            }
            return nil
        }
    }
}

struct ContentView: View {
    @State private var showWatermark = true

    var body: some View {
        ZStack {
            WebView(urlString: "${url}")
                .ignoresSafeArea() 
                .statusBar(hidden: true) 
                .persistentSystemOverlays(.hidden)

            ${!isPremium ? `
            if showWatermark {
                VStack {
                    Spacer()
                    HStack(spacing: 6) {
                        Text("⚡")
                        Text("Built with Web2App Instant | Create Yours Free")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial)
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.indigo.opacity(0.5), lineWidth: 1)
                    )
                    .shadow(radius: 5)
                    .padding(.bottom, 30)
                }
                .transition(.opacity)
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 8) {
                        withAnimation {
                            showWatermark = false
                        }
                    }
                }
            }
            ` : ''}
        }
    }
}
`;

export const getIosApp = () => `import SwiftUI

@main
struct IOSApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
`;

export const getIosWorkflow = (appName: string) => `name: Package iOS Source

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  package:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Zip Source Code
      run: zip -r ios-source-code.zip . -x ".git/*" ".github/*"

    - name: Upload Source
      uses: actions/upload-artifact@v4
      with:
        name: ${appName.replace(/\s+/g, '-')}-iOS-Source
        path: ios-source-code.zip
`;

export const getIosProjectFiles = (config: AppConfig): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const add = (path: string, content: string) => files.push({ path, content, encoding: 'utf-8' });

    // This is a simplified Swift package structure
    // Note: iOS template update is minimal as requested focus was "Java script logic" which implies Android Java/Web bridge primarily.
    // Display Price is passed but Swift UI construction is simplified here compared to Java one.
    add("ContentView.swift", getIosContentView(config.url, config.isPremium, config.monetization.displayPrice));
    add("App.swift", getIosApp());
    add(".github/workflows/package_ios.yml", getIosWorkflow(config.name));
    
    return files;
};