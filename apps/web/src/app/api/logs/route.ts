import { NextRequest } from "next/server";
import { logSchema } from "@securevault/validators";
import { LoggerService } from "@/services/logs.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation({ body: logSchema }, async ({ body }) => {
  const isBackend = body.isBackend ?? false;

  // Handle batch of logs
  if (body.logs && Array.isArray(body.logs)) {
    for (const logItem of body.logs) {
      if (logItem.type !== "LOG") {
        await LoggerService.log({
          type: logItem.type,
          message: logItem.message,
          content: logItem.content ?? "",
          isBackend: isBackend,
        });
      }
    }
  }

  // Handle legacy single log
  else if (body.type && body.message) {
    if (body.type !== "LOG") {
      await LoggerService.log({
        type: body.type,
        message: body.message,
        content: body.content ?? "",
        isBackend: isBackend,
      });
    }
  }

  return SuccessResponse({ message: "Logs processed successfully" });
});
