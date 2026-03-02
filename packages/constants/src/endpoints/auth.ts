import { EndpointT } from "@securevault/types";

/**
 * Authentication endpoint keys.
 * Format: HTTP_METHOD_ACTION
 */
type AuthEndpointKeys =
  | "POST_REGISTER_GENERATE_OPTIONS"
  | "POST_REGISTER_VERIFY"
  | "GET_ME"
  | "POST_LOGIN_GENERATE_OPTIONS"
  | "POST_LOGIN_VERIFY"
  | "POST_PASSWORD_REGISTER"
  | "POST_PASSWORD_LOGIN"
  | "POST_MFA_VERIFY"
  | "POST_LOGOUT"
  | "POST_REFRESH";

/**
 * Authentication API endpoints configuration.
 */
export const AUTH_ENDPOINT: EndpointT<AuthEndpointKeys> = {
  POST_REGISTER_GENERATE_OPTIONS: "/api/auth/register/generate-options",
  POST_REGISTER_VERIFY: "/api/auth/register/verify",
  POST_LOGIN_GENERATE_OPTIONS: "/api/auth/login/generate-options",
  POST_LOGIN_VERIFY: "/api/auth/login/verify",
  POST_PASSWORD_REGISTER: "/api/auth/password/register",
  POST_PASSWORD_LOGIN: "/api/auth/password/login",
  POST_MFA_VERIFY: "/api/auth/mfa/verify",
  POST_REFRESH: "/api/auth/refresh",
  GET_ME: "/api/auth/me",
  POST_LOGOUT: "/api/auth/logout",
};
