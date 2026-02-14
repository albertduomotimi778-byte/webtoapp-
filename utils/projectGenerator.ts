
import { AppConfig, VirtualFile } from "../types";
import { getAndroidManifest, getMainActivity, getBuildGradle, getGithubWorkflow, getStyles, getNotificationReceiver } from "./androidTemplates";
import { getDesktopProjectFiles } from "./desktopTemplates";
import { getIosProjectFiles } from "./iosTemplates";

// Default placeholder icon (100x100 Blue Square PNG)
const DEFAULT_ICON_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAaSURBVHhe7cExAQAAAMKg9U9tDQ8gAAAAAHgYBSAAAd8x1uwAAAAASUVORK5CYII="; 

export const generateProjectFiles = (config: AppConfig): VirtualFile[] => {
  if (config.platform === 'desktop') {
      return getDesktopProjectFiles(config);
  }
  
  if (config.platform === 'ios') {
      return getIosProjectFiles(config);
  }

  const { url, name, iconBase64, themeColor, permissions, isPremium, monetization } = config;
  
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const validPackageSuffix = cleanName.match(/^[0-9]/) || cleanName.length === 0 ? `app${cleanName}` : cleanName;
  const packageName = `com.webtoapp.${validPackageSuffix}`;
  const packagePath = packageName.replace(/\./g, '/');
  
  const files: VirtualFile[] = [];

  const add = (path: string, content: string) => files.push({ path, content, encoding: 'utf-8' });
  const addBinary = (path: string, content: string) => files.push({ path, content, encoding: 'base64' });

  add("gradle.properties", `
org.gradle.jvmargs=-Xmx3072m -Dfile.encoding=UTF-8 -XX:+UseParallelGC
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
android.useAndroidX=true
android.enableJetifier=true
  `.trim());

  add("build.gradle", `
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath "com.android.tools.build:gradle:8.1.1"
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
task clean(type: Delete) {
    delete rootProject.buildDir
}`);
  
  add("settings.gradle", `rootProject.name = "${name.replace(/[^a-zA-Z0-9]/g, '') || 'MyWebToApp'}"
include ':app'`);

  add(".github/workflows/build_apk.yml", getGithubWorkflow(name));
  add("app/build.gradle", getBuildGradle(packageName, monetization));
  add("app/src/main/AndroidManifest.xml", getAndroidManifest(packageName, name, permissions, monetization));
  
  const javaPath = `app/src/main/java/${packagePath}`;
  add(`${javaPath}/MainActivity.java`, getMainActivity(packageName, url, permissions, isPremium, monetization, name));
  add(`${javaPath}/NotificationReceiver.java`, getNotificationReceiver(packageName, name));

  add("app/src/main/res/values/strings.xml", `<resources><string name="app_name">${name}</string></resources>`);
  add("app/src/main/res/values/themes.xml", getStyles(themeColor));
  
  const iconSource = iconBase64 || DEFAULT_ICON_BASE64;
  const iconData = iconSource.includes(',') ? iconSource.split(',')[1] : iconSource;

  addBinary("app/src/main/res/mipmap-mdpi/ic_launcher.png", iconData);
  addBinary("app/src/main/res/mipmap-hdpi/ic_launcher.png", iconData);
  addBinary("app/src/main/res/mipmap-xhdpi/ic_launcher.png", iconData);
  addBinary("app/src/main/res/mipmap-xxhdpi/ic_launcher.png", iconData);

  return files;
};
