export enum AppVersionPlatform {
  ANDROID = "ANDROID",
  IOS = "IOS",
}

export type EasBuildStatus = "finished" | "errored" | "canceled";

export interface EasBuildPayload {
  id: string;
  accountName: string;
  projectName: string;
  buildDetailsPageUrl: string;
  appId: string;
  platform: "android" | "ios";
  status: EasBuildStatus;
  artifacts?: {
    buildUrl?: string;
    logsS3KeyPrefix?: string;
  };
  metadata?: {
    appVersion?: string;
    appBuildVersion?: string;
    buildProfile?: string;
    distribution?: string;
    runtimeVersion?: string;
    channel?: string;
    gitCommitHash?: string;
    gitCommitMessage?: string;
  };
  error?: {
    message: string;
    errorCode: string;
  };
  createdAt: string;
  enqueuedAt: string;
  completedAt?: string;
}

export interface EasUpdatePayload {
  id: string;
  accountName: string;
  projectName: string;
  updateDetailsPageUrl: string;
  appId: string;
  platform: "android" | "ios";
  status: "finished" | "errored";
  metadata?: {
    updateMessage?: string;
    branch?: string;
    runtimeVersion?: string;
    channel?: string;
    gitCommitHash?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface EasSubmitPayload {
  id: string;
  accountName: string;
  projectName: string;
  submissionDetailsPageUrl: string;
  appId: string;
  platform: "android" | "ios";
  status: "finished" | "errored" | "canceled";
  submissionInfo?: {
    error?: {
      message: string;
      errorCode: string;
    };
    logsUrl?: string;
  };
  createdAt: string;
  completedAt?: string;
}

export type EasWebhookPayload =
  | EasBuildPayload
  | EasUpdatePayload
  | EasSubmitPayload;

export function isEasBuildPayload(
  payload: EasWebhookPayload,
): payload is EasBuildPayload {
  return "buildDetailsPageUrl" in payload;
}

export function isEasUpdatePayload(
  payload: EasWebhookPayload,
): payload is EasUpdatePayload {
  return "updateDetailsPageUrl" in payload;
}

export function isEasSubmitPayload(
  payload: EasWebhookPayload,
): payload is EasSubmitPayload {
  return "submissionDetailsPageUrl" in payload;
}
