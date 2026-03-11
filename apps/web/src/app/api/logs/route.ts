import { NextRequest } from "next/server";
import { logSchema } from "@securevault/validators";
import { LoggerService } from "@/services/logs.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
 { body: logSchema },
 async ({ body }) => {
  // The content might come in as any type, we'll let LoggerService handle the stringification
  await LoggerService.log({
   type: body.type,
   message: body.message,
   content: body.content ?? "", // default empty string if no content
   isBackend: body.isBackend,
  });

  return SuccessResponse({ message: "Log saved successfully" });
 },
);
