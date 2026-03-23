import { NextRequest } from "next/server";
import { verifyLoginResponseSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { AuditLogger } from "@/services/audit.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: verifyLoginResponseSchema },
  async ({ body }, req) => {
    const tokens: any = await AuthService.verifyLoginResponse(
      body.email,
      body.authenticationResponse,
    );

    await AuditLogger.log({
      userId: tokens.userId,
      action: "LOGIN_SUCCESS",
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? undefined,
      metadata: { email: body.email, method: "webauthn" },
    });

    return SuccessResponse({ data: tokens });
  },
);
