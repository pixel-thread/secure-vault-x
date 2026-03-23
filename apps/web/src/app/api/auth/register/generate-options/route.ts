import { NextRequest } from "next/server";
import { generateRegistrationOptionsSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: generateRegistrationOptionsSchema },
  async ({ body }) => {
    const { email } = body;
    const options = await AuthService.generateRegistrationOptions(email);
    return SuccessResponse({ data: options });
  },
);
