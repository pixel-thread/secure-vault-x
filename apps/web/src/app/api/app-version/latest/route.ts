import { NextResponse } from "next/server";
import { AppVersionService } from "@/services/appVersion/appVersion.service";
import { AppVersionPlatform } from "@/libs/db/prisma/generated/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const platformParam = searchParams.get("platform");
    const platform = (platformParam?.toUpperCase() as AppVersionPlatform) || "ANDROID";

    const latestVersion = await AppVersionService.getLatestAppVersion(platform);

    if (!latestVersion || !latestVersion.downloadUrl) {
      return NextResponse.json(
        { error: "No active version found for this platform" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      version: latestVersion.version,
      downloadUrl: latestVersion.downloadUrl,
      title: latestVersion.title,
      releaseDate: latestVersion.releaseDate,
    });
  } catch (error) {
    console.error("Error fetching latest app version:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
