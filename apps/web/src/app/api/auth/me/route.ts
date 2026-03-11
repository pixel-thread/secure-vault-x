import { NextRequest } from "next/server";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const GET = withValidation({}, async (_data, req) => {
  const userId = req.headers.get("x-user-id");

  if (!userId) throw new UnauthorizedError("Unauthorized");

  const user = await AuthService.getMe(userId);
  return SuccessResponse({ data: user });
});
