import { NextRequest } from "next/server";
import { DeviceService } from "@/services/device.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { z } from "zod";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

const toggleTrustDeviceSchemaStrict = z.object({
  isTrusted: z.boolean(),
  actingDeviceId: z.string(),
  signature: z.string(),
  timestamp: z.string().regex(/^\d+$/),
});

const paramsSchema = z.object({
  id: z.string(),
});

export const PUT = withValidation(
  { body: toggleTrustDeviceSchemaStrict, params: paramsSchema },
  async ({ body, params }, req) => {
    const { id } = params;
    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const { isTrusted, actingDeviceId, signature, timestamp } = body;

    const result = await DeviceService.updateTrustStatus(
      userId,
      id,
      isTrusted,
      actingDeviceId,
      signature,
      timestamp,
    );

    return SuccessResponse({ data: result });
  },
);
