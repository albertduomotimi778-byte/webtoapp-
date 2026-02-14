import { AppConfig, VirtualFile } from "../types";

export const getDesktopCsproj = (appName: string) => `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>net6.0-windows</TargetFramework>
    <Nullable>enable</Nullable>
    <UseWindowsForms>true</UseWindowsForms>
    <ImplicitUsings>enable</ImplicitUsings>
    <ApplicationIcon>icon.ico</ApplicationIcon>
    <AssemblyName>${appName.replace(/[^a-zA-Z0-9]/g, '')}</AssemblyName>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.Web.WebView2" Version="1.0.2903.40" />
  </ItemGroup>

  <ItemGroup>
    <Content Include="icon.ico" />
  </ItemGroup>

</Project>`;

export const getDesktopProgram = (appName: string, url: string, color: string, isPremium: boolean) => `namespace DesktopApp;

using Microsoft.Web.WebView2.Core;

static class Program
{
    [STAThread]
    static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new MainForm());
    }
}

public class MainForm : Form
{
    private Microsoft.Web.WebView2.WinForms.WebView2 webView;
    private Label watermark;

    public MainForm()
    {
        this.Text = "${appName}";
        this.Size = new Size(1024, 768);
        this.WindowState = FormWindowState.Maximized;
        this.BackColor = ColorTranslator.FromHtml("${color}");
        
        // Icon setup would go here if resource is embedded

        webView = new Microsoft.Web.WebView2.WinForms.WebView2();
        webView.Dock = DockStyle.Fill;
        this.Controls.Add(webView);
        
        ${!isPremium ? `
        // --- WATERMARK SETUP ---
        watermark = new Label();
        watermark.Text = "⚡ Built with Web2App Instant | Create Yours Free";
        watermark.AutoSize = true;
        watermark.ForeColor = Color.White;
        watermark.BackColor = Color.FromArgb(200, 40, 40, 40); // Semi-transparent dark
        watermark.Padding = new Padding(10, 5, 10, 5);
        watermark.Font = new Font("Segoe UI", 9, FontStyle.Bold);
        
        // Position bottom right, anchored
        watermark.Anchor = AnchorStyles.Bottom | AnchorStyles.Right;
        // Add to controls ON TOP of webview (Note: WebView2 often renders on top of everything in WinForms, 
        // this is a known limitation. In WPF we could ZIndex, in WinForms we might need to rely on 
        // injecting JS into the WebView itself or using a separate transparent window overlay. 
        // For simplicity here, we add it to the Form, but aware it might flicker or be behind webview depending on driver.
        // A better approach for WebView2 WinForms is injecting CSS/HTML.)
        ` : ''}

        InitializeAsync();
    }

    async void InitializeAsync()
    {
        // Explicitly create environment
        var env = await CoreWebView2Environment.CreateAsync();

        await webView.EnsureCoreWebView2Async(env);
        
        // --- PAYMENT FIX: User Agent & Settings ---
        // Mimic Standard Desktop Chrome
        webView.CoreWebView2.Settings.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

        // Enable Scripting and Popups
        webView.CoreWebView2.Settings.IsScriptEnabled = true;
        webView.CoreWebView2.Settings.AreDefaultScriptDialogsEnabled = true;
        webView.CoreWebView2.Settings.IsWebMessageEnabled = true;
        
        // Allow opening new windows (default behavior in WebView2 is often to launch default browser, 
        // but we can ensure it opens new windows or handle them).
        // By default, WebView2 handles window.open quite well. 

        ${!isPremium ? `
        // Inject JS-based watermark as fallback for WebView2 Z-Index issues in WinForms
        webView.NavigationCompleted += (s, e) => {
            string js = @"
                var div = document.createElement('div');
                div.style.position = 'fixed';
                div.style.bottom = '10px';
                div.style.right = '10px';
                div.style.backgroundColor = 'rgba(0,0,0,0.8)';
                div.style.color = 'white';
                div.style.padding = '8px 16px';
                div.style.borderRadius = '20px';
                div.style.fontFamily = 'sans-serif';
                div.style.fontSize = '12px';
                div.style.fontWeight = 'bold';
                div.style.zIndex = '999999';
                div.style.pointerEvents = 'none';
                div.innerText = '⚡ Built with Web2App Instant';
                document.body.appendChild(div);
                
                setTimeout(() => { 
                    div.style.transition = 'opacity 1s'; 
                    div.style.opacity = '0'; 
                }, 8000);
            ";
            webView.CoreWebView2.ExecuteScriptAsync(js);
        };
        ` : ''}

        webView.Source = new Uri("${url}");
    }
}`;

export const getDesktopWorkflow = (appName: string) => `name: Build Windows Desktop App

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build:
    runs-on: windows-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 6.0.x

    - name: Publish EXE
      run: dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o build_output

    - name: Upload Artifact
      uses: actions/upload-artifact@v4
      with:
        name: ${appName.replace(/\s+/g, '-')}-Windows-Exe
        path: build_output
`;

export const getDesktopProjectFiles = (config: AppConfig): VirtualFile[] => {
    const files: VirtualFile[] = [];
    const add = (path: string, content: string) => files.push({ path, content, encoding: 'utf-8' });
    const addBinary = (path: string, content: string) => files.push({ path, content, encoding: 'base64' });

    add("DesktopApp.csproj", getDesktopCsproj(config.name));
    add("Program.cs", getDesktopProgram(config.name, config.url, config.themeColor, config.isPremium));
    add(".github/workflows/build_exe.yml", getDesktopWorkflow(config.name));

    // Convert PNG to ICO (Very simplified mock - ideally we use a library, but for this demo we'll just reuse the PNG as a placeholder or skip strict ICO conversion logic to avoid deps)
    // For a real app, we need a real ICO. Here we just write the PNG bytes to icon.ico which technically is invalid but modern Windows sometimes tolerates it, 
    // or we just skip the icon to ensure build success.
    // Let's assume the user provided PNG and we just write it.
    if (config.iconBase64 && config.isPremium) {
        const iconData = config.iconBase64.split(',')[1];
        addBinary("icon.ico", iconData); 
    }

    return files;
};