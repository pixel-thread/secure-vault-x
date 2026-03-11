import { NextRequest } from "next/server";
import { passwordLoginSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { AuditLogger } from "@/services/audit.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
 { body: passwordLoginSchema },
 async ({ body }, req) => {
  const { email, password } = body;
  const result: any = await AuthService.loginPassword(email, password);

  if (result.requiresMfa) {
   await AuditLogger.log({
    action: "OTP_GENERATE",
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? undefined,
    metadata: { email }
   });
  } else if (result.accessToken) {
   await AuditLogger.log({
    userId: result.userId,
    action: "LOGIN_SUCCESS",
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? undefined,
    metadata: { email, method: "password" }
   });
  }

  return SuccessResponse({
   data: result,
   message: result.message || "Login successful",
  });
 }
);
