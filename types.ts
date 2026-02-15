
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

export interface AppConfig {
  platform: Platform;
  url: string;
  name: string;
  description: string;
  iconBase64: string | null;
  themeColor: string;
  githubToken?: string;
  permissions: AppPermissions;
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
