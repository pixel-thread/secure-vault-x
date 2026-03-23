import { prisma } from "@/libs/db/prisma";
import {
  EasBuildPayload,
  EasUpdatePayload,
  EasSubmitPayload,
  AppVersionPlatform,
} from "@securevault/types";

export const upsertEASWebhook = async (
  type: "BUILD" | "UPDATE" | "SUBMIT",
  payload: EasBuildPayload | EasUpdatePayload | EasSubmitPayload,
) => {
  const commonData = {
    easId: payload.id,
    type: type as any,
    accountName: payload.accountName,
    projectName: payload.projectName,
    appId: payload.appId,
    platform: payload.platform.toUpperCase() as any,
    status: payload.status.toUpperCase() as any,
    createdAt: new Date(payload.createdAt),
    completedAt: payload.completedAt ? new Date(payload.completedAt) : null,
    rawPayload: payload as any,
  };

  if (type === "BUILD") {
    const build = payload as EasBuildPayload;
    return prisma.eASWebhook.upsert({
      where: { easId: build.id },
      create: {
        ...commonData,
        detailsPageUrl: build.buildDetailsPageUrl,
        buildUrl: build.artifacts?.buildUrl,
        logsS3KeyPrefix: build.artifacts?.logsS3KeyPrefix,
        appVersion: build.metadata?.appVersion,
        appBuildVersion: build.metadata?.appBuildVersion,
        buildProfile: build.metadata?.buildProfile,
        distribution: build.metadata?.distribution,
        runtimeVersion: build.metadata?.runtimeVersion,
        channel: build.metadata?.channel,
        gitCommitHash: build.metadata?.gitCommitHash,
        gitCommitMessage: build.metadata?.gitCommitMessage,
        enqueuedAt: build.enqueuedAt ? new Date(build.enqueuedAt) : null,
        errorMessage: build.error?.message,
        errorCode: build.error?.errorCode,
      },
      update: {
        ...commonData,
        status: build.status.toUpperCase() as any,
        completedAt: build.completedAt ? new Date(build.completedAt) : null,
        buildUrl: build.artifacts?.buildUrl,
        errorMessage: build.error?.message,
        errorCode: build.error?.errorCode,
      },
    });
  }

  if (type === "UPDATE") {
    const update = payload as EasUpdatePayload;
    return prisma.eASWebhook.upsert({
      where: { easId: update.id },
      create: {
        ...commonData,
        detailsPageUrl: update.updateDetailsPageUrl,
        appVersion: update.metadata?.runtimeVersion, // Using runtimeVersion for updates
        buildProfile: update.metadata?.channel,
        channel: update.metadata?.channel,
        gitCommitHash: update.metadata?.gitCommitHash,
        updateMessage: update.metadata?.updateMessage,
        branch: update.metadata?.branch,
      },
      update: {
        ...commonData,
        status: update.status.toUpperCase() as any,
        completedAt: update.completedAt ? new Date(update.completedAt) : null,
      },
    });
  }

  if (type === "SUBMIT") {
    const submit = payload as EasSubmitPayload;
    return prisma.eASWebhook.upsert({
      where: { easId: submit.id },
      create: {
        ...commonData,
        detailsPageUrl: submit.submissionDetailsPageUrl,
        errorMessage: submit.submissionInfo?.error?.message,
        errorCode: submit.submissionInfo?.error?.errorCode,
      },
      update: {
        ...commonData,
        status: submit.status.toUpperCase() as any,
        completedAt: submit.completedAt ? new Date(submit.completedAt) : null,
        errorMessage: submit.submissionInfo?.error?.message,
        errorCode: submit.submissionInfo?.error?.errorCode,
      },
    });
  }
};
