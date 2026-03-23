import { NextRequest } from "next/server";
import { passwordRegisterSchema } from "@securevault/validators";
import { AuthService } from "@/services/auth.service";
import { SuccessResponse } from "@/utils/next-response";
import { withValidation } from "@/utils/middleware/withValidiation";

export const POST = withValidation(
  { body: passwordRegisterSchema },
  async ({ body }) => {
    const { email, password } = body;
    const result = await AuthService.registerPassword(email, password);
    return SuccessResponse({
      data: result,
      message: "Registration successfully, please login to continue.",
    });
  },
);
