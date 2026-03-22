-- CreateEnum
CREATE TYPE "EASBuildStatus" AS ENUM ('FINISHED', 'ERRORED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AppVersionPlatform" AS ENUM ('ANDROID', 'IOS');

-- CreateEnum
CREATE TYPE "AppVersionTags" AS ENUM ('BETA', 'STABLE', 'BUGFIX', 'PATCH');

-- CreateEnum
CREATE TYPE "AppVersionType" AS ENUM ('PTA', 'OTA');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "EASWebhookType" AS ENUM ('BUILD', 'UPDATE', 'SUBMIT');

-- AlterTable
ALTER TABLE "Vault" ALTER COLUMN "version" SET DATA TYPE BIGINT;

-- CreateTable
CREATE TABLE "EASWebhook" (
    "id" UUID NOT NULL,
    "easId" TEXT NOT NULL,
    "type" "EASWebhookType" NOT NULL,
    "accountName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "appId" TEXT,
    "platform" "AppVersionPlatform",
    "status" "EASBuildStatus" NOT NULL,
    "detailsPageUrl" TEXT,
    "buildUrl" TEXT,
    "logsS3KeyPrefix" TEXT,
    "appVersion" TEXT,
    "appBuildVersion" TEXT,
    "buildProfile" TEXT,
    "distribution" TEXT,
    "runtimeVersion" TEXT,
    "channel" TEXT,
    "gitCommitHash" TEXT,
    "gitCommitMessage" TEXT,
    "updateMessage" TEXT,
    "branch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "enqueuedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "rawPayload" JSONB NOT NULL,

    CONSTRAINT "EASWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppVersion" (
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT[],
    "type" "AppVersionType" NOT NULL DEFAULT 'PTA',
    "platforms" "AppVersionPlatform"[] DEFAULT ARRAY['ANDROID', 'IOS']::"AppVersionPlatform"[],
    "releaseNotesUrl" TEXT,
    "downloadUrl" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minSupportedVersion" TEXT,
    "author" TEXT,
    "tags" "AppVersionTags"[] DEFAULT ARRAY['STABLE']::"AppVersionTags"[],
    "additionalInfo" JSONB,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "versionCode" INTEGER,
    "buildNumber" TEXT,
    "runtimeVersion" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "EASWebhook_easId_key" ON "EASWebhook"("easId");

-- CreateIndex
CREATE INDEX "EASWebhook_platform_idx" ON "EASWebhook"("platform");

-- CreateIndex
CREATE INDEX "EASWebhook_status_idx" ON "EASWebhook"("status");

-- CreateIndex
CREATE INDEX "EASWebhook_type_idx" ON "EASWebhook"("type");

-- CreateIndex
CREATE INDEX "EASWebhook_completedAt_idx" ON "EASWebhook"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppVersion_version_key" ON "AppVersion"("version");

-- CreateIndex
CREATE INDEX "AppVersion_version_idx" ON "AppVersion"("version");
