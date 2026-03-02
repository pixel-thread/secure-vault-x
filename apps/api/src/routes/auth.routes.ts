import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  generateRegistrationOptionsSchema,
  verifyRegistrationResponseSchema,
  generateLoginOptionsSchema,
  verifyLoginResponseSchema,
  passwordRegisterSchema,
  passwordLoginSchema,
  verifyOtpSchema,
  refreshTokensSchema,
} from "@securevault/validators";
import { AUTH_ENDPOINT } from "@securevault/constants";
import { AuthController } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";

const authRouter = new Hono();

// Registration WebAuthn Flow
authRouter.post(
  AUTH_ENDPOINT.POST_REGISTER_GENERATE_OPTIONS,
  zValidator("json", generateRegistrationOptionsSchema),
  AuthController.registerGenerateOptions,
);
authRouter.post(
  AUTH_ENDPOINT.POST_REGISTER_VERIFY,
  zValidator("json", verifyRegistrationResponseSchema),
  AuthController.registerVerify,
);

// Login WebAuthn Flow
authRouter.post(
  AUTH_ENDPOINT.POST_LOGIN_GENERATE_OPTIONS,
  zValidator("json", generateLoginOptionsSchema),
  AuthController.loginGenerateOptions,
);
authRouter.post(
  AUTH_ENDPOINT.POST_LOGIN_VERIFY,
  zValidator("json", verifyLoginResponseSchema),
  AuthController.loginVerify,
);

// Email/Password Logins
authRouter.post(
  AUTH_ENDPOINT.POST_PASSWORD_REGISTER,
  zValidator("json", passwordRegisterSchema),
  AuthController.registerPassword,
);

authRouter.post(
  AUTH_ENDPOINT.POST_PASSWORD_LOGIN,
  zValidator("json", passwordLoginSchema),
  AuthController.loginPassword,
);
authRouter.post(
  AUTH_ENDPOINT.POST_MFA_VERIFY,
  zValidator("json", verifyOtpSchema),
  AuthController.verifyOtp,
);

// Token Rotation
authRouter.post(
  AUTH_ENDPOINT.POST_REFRESH,
  zValidator("json", refreshTokensSchema),
  AuthController.refreshTokens,
);

authRouter.get(AUTH_ENDPOINT.GET_ME, protect, AuthController.getMe);

export { authRouter };
