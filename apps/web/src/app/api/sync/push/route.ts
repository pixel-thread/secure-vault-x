import { syncPushSchema } from "@securevault/validators";
import { SyncService } from "@/services/sync.service";
import { SuccessResponse } from "@/utils/next-response/successResponse";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const POST = withValidation(
  { body: syncPushSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const mappedItems = body.items.map((item: any) => ({
      ...item,
      updatedAt: new Date(item.updatedAt),
      deletedAt: item.deletedAt ? new Date(item.deletedAt) : null,
    }));

    const results = await SyncService.syncItems(userId, mappedItems);

    return SuccessResponse({
      data: results,
      message: "Items synced successfully",
    });
  },
);
