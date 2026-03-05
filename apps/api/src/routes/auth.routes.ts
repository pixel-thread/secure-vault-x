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
  revokeOtpSchema,
  refreshTokensSchema,
  setEncryptionSaltSchema,
  toggleMfaSchema,
} from "@securevault/validators";
import { AUTH_ENDPOINT } from "@securevault/constants";
import { AuthController } from "../controllers/auth.controller";
import { protect } from "../middlewares/auth.middleware";
import { errorHandler } from "../middlewares/error.middleware";
import { validatorHook } from "../utils/helper/validator";

const authRouter = new Hono();
authRouter.onError(errorHandler);

// Registration WebAuthn Flow
authRouter.post(
  AUTH_ENDPOINT.POST_REGISTER_GENERATE_OPTIONS,
  zValidator("json", generateRegistrationOptionsSchema, validatorHook),
  AuthController.registerGenerateOptions,
);
authRouter.post(
  AUTH_ENDPOINT.POST_REGISTER_VERIFY,
  zValidator("json", verifyRegistrationResponseSchema, validatorHook),
  AuthController.registerVerify,
);

// Login WebAuthn Flow
authRouter.post(
  AUTH_ENDPOINT.POST_LOGIN_GENERATE_OPTIONS,
  zValidator("json", generateLoginOptionsSchema, validatorHook),
  AuthController.loginGenerateOptions,
);
authRouter.post(
  AUTH_ENDPOINT.POST_LOGIN_VERIFY,
  zValidator("json", verifyLoginResponseSchema, validatorHook),
  AuthController.loginVerify,
);

// Email/Password Logins
authRouter.post(
  AUTH_ENDPOINT.POST_PASSWORD_REGISTER,
  zValidator("json", passwordRegisterSchema, validatorHook),
  AuthController.registerPassword,
);

authRouter.post(
  AUTH_ENDPOINT.POST_PASSWORD_LOGIN,
  zValidator("json", passwordLoginSchema, validatorHook),
  AuthController.loginPassword,
);
authRouter.post(
  AUTH_ENDPOINT.POST_MFA_VERIFY,
  zValidator("json", verifyOtpSchema, validatorHook),
  AuthController.verifyOtp,
);

// Token Rotation
authRouter.post(
  AUTH_ENDPOINT.POST_REFRESH,
  zValidator("json", refreshTokensSchema, validatorHook),
  AuthController.refreshTokens,
);

authRouter.get(
  AUTH_ENDPOINT.GET_MFA_PENDING,
  protect,
  AuthController.getPendingOtp,
);

authRouter.post(
  AUTH_ENDPOINT.POST_MFA_REVOKE,
  protect,
  zValidator("json", revokeOtpSchema, validatorHook),
  AuthController.revokeOtp,
);

authRouter.get(AUTH_ENDPOINT.GET_ME, protect, AuthController.getMe);

authRouter.post(
  AUTH_ENDPOINT.POST_LOGOUT,
  protect,
  zValidator("json", refreshTokensSchema, validatorHook),
  AuthController.logout,
);

// Encryption Data
authRouter.get(
  AUTH_ENDPOINT.GET_ENCRYPTION_SALT,
  protect,
  AuthController.getEncryptionSalt,
);

authRouter.post(
  AUTH_ENDPOINT.POST_ENCRYPTION_SALT,
  protect,
  zValidator("json", setEncryptionSaltSchema, validatorHook),
  AuthController.setEncryptionSalt,
);

// MFA Toggle
authRouter.post(
  AUTH_ENDPOINT.POST_MFA_TOGGLE,
  protect,
  zValidator("json", toggleMfaSchema, validatorHook),
  AuthController.toggleMfa,
);

export { authRouter };
