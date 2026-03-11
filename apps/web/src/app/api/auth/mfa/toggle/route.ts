import { NextRequest } from "next/server";
import { toggleMfaSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { AuditLogger } from "@/services/audit.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const POST = withValidation(
  { body: toggleMfaSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

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
