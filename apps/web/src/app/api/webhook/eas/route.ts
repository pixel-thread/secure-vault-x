import { NextRequest } from "next/server";
import { ErrorResponse, SuccessResponse } from "@/utils/next-response";
import {
  type EasWebhookPayload,
  isEasBuildPayload,
  isEasUpdatePayload,
  isEasSubmitPayload,
} from "@securevault/types";
import { verifyExpoSignature } from "@/utils/eas/verifyExpoSignature";
import { promoteToAppVersion } from "@/services/appVersion/promoteToAppVersion";
import { upsertEASWebhook } from "@/services/easWebhook.service";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation({}, async ({}, req: NextRequest) => {
  const signature = req.headers.get("expo-signature");
  const body = await req.text();

  const valid = verifyExpoSignature(body, signature);
  if (!valid) {
    return ErrorResponse({
      error: "EAS signature error",
      status: 401,
      message: "Invalid signature",
    });
  }

  let payload: EasWebhookPayload;

  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  try {
    if (isEasBuildPayload(payload)) {
      await upsertEASWebhook("BUILD", payload);
      if (payload.status === "finished") {
        await promoteToAppVersion(payload);
      }
    } else if (isEasUpdatePayload(payload)) {
      await upsertEASWebhook("UPDATE", payload);
    } else if (isEasSubmitPayload(payload)) {
      await upsertEASWebhook("SUBMIT", payload);
    }

    return SuccessResponse({
      data: "Webhook received",
      status: 201,
    });
  } catch (error: any) {
    return ErrorResponse({
      error: "Internal Error",
      status: 500,
    });
  }
});
