import { NextRequest } from "next/server";
import { revokeOtpSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const POST = withValidation(
  { body: revokeOtpSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const { otpId } = body;
    const result = await AuthService.revokeOtp(userId, otpId);
    return SuccessResponse({
      data: result,
      message: "OTP successfully revoked",
    });
  },
);
