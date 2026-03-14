import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { AuditLogger } from "@/services/audit.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";
import { changePasswordSchema } from "@securevault/validators";

export const POST = withValidation(
  { body: changePasswordSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const result = await AuthService.changePassword(
      userId,
      body.currentPassword || "",
      body.newPassword,
      body.otp,
    );

    await AuditLogger.log({
      userId,
      action: "PASSWORD_CHANGE",
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return SuccessResponse({ data: result, message: result.message });
  },
);
