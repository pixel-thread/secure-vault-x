import { NextRequest } from "next/server";
import { VaultService } from "@/services/vault.service";
import { addSecretSchema } from "@securevault/validators";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const POST = withValidation(
  { body: addSecretSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const result = await VaultService.addSecret(userId, body);

    return SuccessResponse({ data: result });
  },
);
