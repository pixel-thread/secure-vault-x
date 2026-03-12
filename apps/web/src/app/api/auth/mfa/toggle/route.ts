import { NextRequest } from "next/server";
import { toggleMfaSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { AuditLogger } from "@/services/audit.service";
import { ErrorResponse, SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";
import { prisma } from "@libs/db/prisma";

export const POST = withValidation(
  { body: toggleMfaSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    const sessionId = req.headers.get("x-session-id");

    if (!sessionId || !userId) throw new UnauthorizedError("Unauthorized");

    const session = await prisma.refreshToken.findUnique({
      where: { id: sessionId },
      include: { device: true },
    });

    if (!session?.device?.isTrusted) {
      return ErrorResponse({
        status: 403,
        message: "Only trusted devices can toggle MFA",
        data: [],
      });
    }

    const { enabled } = body;
    const result = await AuthService.toggleMfa(userId, enabled);

    await AuditLogger.log({
      userId,
      action: "MFA_TOGGLE",
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? undefined,
      metadata: { enabled },
    });

    return SuccessResponse({
      data: result,
      message: enabled
        ? "Two-factor authentication enabled"
        : "Two-factor authentication disabled",
    });
  },
);
