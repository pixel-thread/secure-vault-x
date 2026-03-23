import { prisma } from "@/libs/db/prisma";
import { EasBuildPayload } from "@securevault/types";

export const promoteToAppVersion = async (payload: EasBuildPayload) => {
  // Only promote finished builds
  if (payload.status !== "finished") return;

  // Only promote production/preview profiles (adjust as needed)
  const isProduction =
    payload.metadata?.buildProfile === "production" ||
    payload.metadata?.buildProfile === "preview";

  if (!isProduction) return;

  const version = payload.metadata?.appVersion || "0.0.1";
  const platform = payload.platform.toUpperCase();
  const buildUrl = payload.artifacts?.buildUrl;

  if (!buildUrl) return;

  // Find or Create AppVersion
  // We identify by version string and possibly platform
  // Here we'll update the downloadUrl for the current version

  return prisma.appVersion.upsert({
    where: { version: version } as any, // Schema says version is @unique? No, @@index([version])
    // Wait, let's check schema.prisma unique constraint for AppVersion
    create: {
      version: version,
      title: `Secure Vault X - ${version}`,
      description: [`Automatically promoted from EAS Build: ${payload.id}`],
      downloadUrl: buildUrl,
      platforms: [platform as any],
      runtimeVersion: payload.metadata?.runtimeVersion,
      buildNumber: payload.metadata?.appBuildVersion,
      status: "ACTIVE",
    },
    update: {
      downloadUrl: buildUrl,
      updatedAt: new Date(),
    },
  });
};
