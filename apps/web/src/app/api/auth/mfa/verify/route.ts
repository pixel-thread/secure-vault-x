import { NextRequest } from "next/server";
import { verifyOtpSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { AuditLogger } from "@/services/audit.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: verifyOtpSchema },
  async ({ body }, req) => {
    const { email, code } = body;
    const tokens: any = await AuthService.verifyOtp(email, code);

    await AuditLogger.log({
      userId: tokens.userId,
      action: "OTP_VERIFY",
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? undefined,
      metadata: { email },
    });

    return SuccessResponse({ data: tokens });
  },
);
