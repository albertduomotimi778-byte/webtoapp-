import { AppConfig } from "../types";
import JSZip from "jszip";
import { generateProjectFiles } from "./projectGenerator";

// --- MODE 1: DOWNLOAD CLOUD-READY SOURCE ---
export const generateAndroidSource = async (config: AppConfig) => {
  const zip = new JSZip();
  const files = generateProjectFiles(config);

  files.forEach(file => {
      zip.file(file.path, file.content, { base64: file.encoding === 'base64' });
  });
  
  const content = await zip.generateAsync({ type: "blob" });
  
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `${config.name.replace(/\s+/g, '-').toLowerCase()}-source.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};

// --- MODE 2: BUILD APK ON SERVER ---
// Kept for backward compatibility if needed, but not used in new flow
export const buildApkOnServer = async (config: AppConfig, backendUrl: string) => {
    console.warn("Direct server build not used in Cloud Mode");
    throw new Error("Use the Cloud Build option.");
};
