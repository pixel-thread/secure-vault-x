import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { MiddlewareFactory } from "./stackMiddleware";
import { handleApiErrors } from "../errors/handleApiErrors";
import { UnauthorizedError } from "../errors/unAuthError";

const JWT_SECRET_STRING = process.env.JWT_SECRET;
const JWT_SECRET = JWT_SECRET_STRING
  ? new TextEncoder().encode(JWT_SECRET_STRING)
  : new Uint8Array();

const PUBLIC_API_ROUTES = new Set([
  "/api/auth/register/generate-options",
  "/api/auth/register/verify",
  "/api/auth/login/generate-options",
  "/api/auth/login/verify",
  "/api/auth/password/register",
  "/api/auth/password/login",
  "/api/auth/mfa/verify",
  "/api/auth/refresh",
]);

export const withAuth: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next) => {
    try {
      const { pathname } = request.nextUrl;

      if (!pathname.startsWith("/api/") || PUBLIC_API_ROUTES.has(pathname)) {
        return await next(request, _next);
      }

      if (!JWT_SECRET_STRING) {
        throw new UnauthorizedError("Unauthorized");
      }

      const authHeader =
        request.headers.get("authorization") ||
        request.headers.get("Authorization");

      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

      if (!token) {
        throw new UnauthorizedError("Unauthorized");
      }

      const { payload } = await jwtVerify(token, JWT_SECRET, {
        issuer: "securevaultx-api",
        audience: "securevaultx-client",
      });

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", payload.userId as string);
      requestHeaders.set("x-session-id", payload.sessionId as string);

      const modifiedRequest = new NextRequest(request.url, {
        headers: requestHeaders,
        method: request.method,
        body: request.body,
        duplex: "half",
      });

      return await next(modifiedRequest, _next);
    } catch (error) {
      return handleApiErrors(error);
    }
  };
};
