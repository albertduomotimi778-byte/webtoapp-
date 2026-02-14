

export type Platform = 'android' | 'ios' | 'desktop';

export interface AppPermissions {
  camera: boolean;
  microphone: boolean;
  location: boolean;
  fileUpload: boolean;
  popups: boolean;
  pushNotifications: boolean;
  screenRecording: boolean;
  alarmReminders: boolean;
}

export interface MonetizationSettings {
  enabled: boolean; // AdMob
  appId: string;
  bannerId: string;
  
  // IAP / Subscription Settings
  iapEnabled: boolean;
  iapMode: 'integrated' | 'locked_app'; // 'integrated' = User has UI, 'locked_app' = We provide UI
  subscriptionPlan: 'monthly' | 'yearly';
  storeUrl: string; // The URL to pay
  successUrl: string; // The URL to listen for success
  durationValue: number;
  durationUnit: 'seconds' | 'minutes' | 'hours' | 'days' | 'months';
  
  // Customization
  displayPrice: string; // E.g. "$4.99"
}

export interface AppConfig {
  platform: Platform;
  url: string;
  name: string;
  description: string;
  iconBase64: string | null;
  themeColor: string;
  githubToken?: string;
  permissions: AppPermissions;
  monetization: MonetizationSettings;
  isPremium: boolean;
}

export interface VirtualFile {
  path: string;
  content: string; // Text content or Base64 string for binary
  encoding: 'utf-8' | 'base64';
}

export enum GenerationStep {
  IDLE = 'IDLE',
  READY = 'READY',
  // Cloud Build Steps
  CREATING_REPO = 'CREATING_REPO',
  PUSHING_CODE = 'PUSHING_CODE',
  WAITING_FOR_BUILD = 'WAITING_FOR_BUILD',
  DOWNLOADING_ARTIFACT = 'DOWNLOADING_ARTIFACT',
  DELETING_REPO = 'DELETING_REPO',
  FINISHED = 'FINISHED',
  ERROR = 'ERROR'
}