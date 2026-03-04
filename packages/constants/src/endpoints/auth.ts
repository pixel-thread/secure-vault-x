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
  | "POST_MFA_TOGGLE"
  | "GET_MFA_PENDING"
  | "POST_MFA_REVOKE"
  | "POST_LOGOUT"
  | "POST_REFRESH"
  | "GET_ENCRYPTION_SALT"
  | "POST_ENCRYPTION_SALT";

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
  POST_MFA_TOGGLE: "/api/auth/mfa/toggle",
  GET_MFA_PENDING: "/api/auth/mfa/pending",
  POST_MFA_REVOKE: "/api/auth/mfa/revoke",
  POST_REFRESH: "/api/auth/refresh",
  GET_ME: "/api/auth/me",
  POST_LOGOUT: "/api/auth/logout",
  GET_ENCRYPTION_SALT: "/api/auth/encryption/salt",
  POST_ENCRYPTION_SALT: "/api/auth/encryption/salt",
};
