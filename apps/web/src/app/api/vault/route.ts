import { NextRequest } from "next/server";
import { VaultService } from "@/services/vault.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const GET = withValidation({}, async (_data, req) => {
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new UnauthorizedError("Unauthorized");

  const vaults = await VaultService.getVault(userId);
  return SuccessResponse({ data: vaults });
});
