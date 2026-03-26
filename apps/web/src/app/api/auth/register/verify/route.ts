import { NextRequest } from "next/server";
import { verifyRegistrationResponseSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { AuditLogger } from "@/services/audit.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: verifyRegistrationResponseSchema },
  async ({ body }, req) => {
    const result: any = await AuthService.verifyRegistrationResponse(
      body.email,
      body.registrationResponse,
      body.deviceName,
      body.publicKey,
      body.encryptedMEK,
    );

    await AuditLogger.log({
      userId: result.sessionId,
      action: "DEVICE_REGISTER",
      ip: req.headers.get("x-forwarded-for") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? undefined,
      metadata: { email: body.email, deviceName: body.deviceName },
    });

    return SuccessResponse({ data: result });
  },
);
