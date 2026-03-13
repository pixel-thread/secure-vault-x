import { NextRequest } from "next/server";
import { DeviceService } from "@/services/device.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { z } from "zod";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

const toggleTrustDeviceSchemaStrict = z.object({
  isTrusted: z.boolean({ message: "isTrusted is required" }).catch(false),
  actingDeviceId: z
    .string({ message: "Acting device id is required" })
    .uuid("Invalid acting device id"),
  signature: z.string({ message: "Signature is required" }),
  timestamp: z
    .string({ message: "Timestamp is required" })
    .regex(/^\d+$/, "Timestamp must be a number"),
});

const paramsSchema = z.object({
  id: z.string({ message: "Device id is required" }).uuid("Invalid device id"),
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
