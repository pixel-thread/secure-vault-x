import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { ErrorResponse, SuccessResponse } from "@/utils/next-response";
import { prisma } from "@securevault/database";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const GET = withValidation({}, async (_data, req) => {
  const userId = req.headers.get("x-user-id");
  const sessionId = req.headers.get("x-session-id");

  if (!sessionId || !userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  // A01 Fix: Gracefully reject untrusted devices without crashing
  const session = await prisma.refreshToken.findUnique({
    where: { id: sessionId },
    include: { device: true },
  });

  if (!session?.device?.isTrusted) {
    return ErrorResponse({
      status: 403,
      message: "Untrusted device",
      data: [],
    });
  }

  const otps = await AuthService.getPendingOtp(userId);
  return SuccessResponse({ data: otps });
});
