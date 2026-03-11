import { NextRequest } from "next/server";
import { refreshTokensSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: refreshTokensSchema },
  async ({ body }) => {
    const { refreshToken } = body;
    const tokens = await AuthService.refreshTokens(refreshToken);
    return SuccessResponse({ data: tokens });
  },
);
