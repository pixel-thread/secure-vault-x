import { NextRequest } from "next/server";
import { refreshTokensSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: refreshTokensSchema },
  async ({ body }) => {
    const { refreshToken } = body;
    await AuthService.logout(refreshToken);
    return SuccessResponse({ message: "Logout successful" });
  },
);
