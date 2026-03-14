import { NextRequest } from "next/server";
import { setEncryptionSaltSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const GET = withValidation({}, async (_data, req) => {
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new Error("Unauthorized");

  const encryptionData = await AuthService.getEncryptionSalt(userId);
  return SuccessResponse({
    data: encryptionData,
    message: "Encryption salt fetched successfully",
  });
});

export const POST = withValidation(
  { body: setEncryptionSaltSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const { salt } = body;
    const encryptionData = await AuthService.setEncryptionSalt(userId, salt);
    return SuccessResponse({ data: encryptionData, message: "Salt set" });
  },
);
