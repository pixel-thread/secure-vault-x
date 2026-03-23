import { prisma } from "@/libs/db/prisma";
import { AppVersionPlatform, Status } from "@/libs/db/prisma/generated/prisma";

export class AppVersionService {
  /**
   * Fetches the latest active app version for a given platform.
   * Defaults to ANDROID if no platform is specified.
   */
  static async getLatestAppVersion(platform: AppVersionPlatform = "ANDROID") {
    return prisma.appVersion.findFirst({
      where: {
        status: Status.ACTIVE,
        platforms: {
          has: platform,
        },
      },
      orderBy: {
        releaseDate: "desc",
      },
    });
  }
}
