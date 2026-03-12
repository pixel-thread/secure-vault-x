import { syncPullSchema } from "@securevault/validators";
import { SyncService } from "@/services/sync.service";
import { SuccessResponse } from "@/utils/next-response/successResponse";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const GET = withValidation(
 { query: syncPullSchema },
 async ({ query }, req) => {
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new UnauthorizedError("Unauthorized");

  let since = new Date(0);
  if (query?.since) {
   if (/^\d+$/.test(query.since)) {
    since = new Date(parseInt(query.since));
   } else {
    since = new Date(query.since);
   }
  }

  const changes = await SyncService.getChanges(userId, since);

  return SuccessResponse({
   data: {
    items: changes.map((item: any) => ({
     id: item.id,
     encryptedData: item.encryptedData,
     iv: item.iv,
     version: item.version,
     updatedAt: item.updatedAt.getTime(),
     deletedAt: item.deletedAt ? item.deletedAt.getTime() : null,
    })),
    serverTime: Date.now()
   }
  });
 }
);
