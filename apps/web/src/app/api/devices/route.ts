import { NextRequest } from "next/server";
import { DeviceService } from "@/services/device.service";
import { registerDeviceSchema } from "@securevault/validators";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";
import { UnauthorizedError } from "@/utils/errors/unAuthError";

export const GET = withValidation({}, async (_data, req) => {
  const userId = req.headers.get("x-user-id");
  if (!userId) throw new UnauthorizedError("Unauthorized");

  const devices = await DeviceService.getDevices(userId);
  return SuccessResponse({ data: devices });
});

export const POST = withValidation(
  { body: registerDeviceSchema },
  async ({ body }, req) => {
    const userId = req.headers.get("x-user-id");
    const sessionId = req.headers.get("x-session-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const result = await DeviceService.registerDevice(
      userId,
      body.deviceName,
      body.publicKey,
      sessionId ?? undefined,
      body.deviceIdentifier,
    );

    return SuccessResponse({ data: result });
  },
);
