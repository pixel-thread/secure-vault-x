import { NextRequest } from "next/server";
import { generateLoginOptionsSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: generateLoginOptionsSchema },
  async ({ body }) => {
    const { email } = body;
    const options = await AuthService.generateLoginOptions(email);
    return SuccessResponse({ data: options });
  },
);
