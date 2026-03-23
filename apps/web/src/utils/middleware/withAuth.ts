import { NextRequest } from "next/server";
import { MiddlewareFactory } from "./stackMiddleware";
import { handleApiErrors } from "../errors/handleApiErrors";
import { UnauthorizedError } from "../errors/unAuthError";
import { JWTService } from "@/services/jwt.services";
import {
  APP_VERSION_ENDPOINT,
  LOG_ENDPOINT,
  AUTH_ENDPOINT,
} from "@securevault/constants";

const PUBLIC_API_ROUTES = new Set([
  AUTH_ENDPOINT.POST_REGISTER_GENERATE_OPTIONS,
  AUTH_ENDPOINT.POST_LOGIN_GENERATE_OPTIONS,
  AUTH_ENDPOINT.POST_REGISTER_VERIFY,
  AUTH_ENDPOINT.POST_LOGIN_VERIFY,
  AUTH_ENDPOINT.POST_REFRESH,
  AUTH_ENDPOINT.POST_PASSWORD_LOGIN,
  AUTH_ENDPOINT.POST_PASSWORD_REGISTER,
  AUTH_ENDPOINT.POST_MFA_VERIFY,
  APP_VERSION_ENDPOINT.GET_LATEST,
  LOG_ENDPOINT.POST_LOGS,
]);

export const withAuth: MiddlewareFactory = (next) => {
  return async (request: NextRequest, event) => {
    try {
      const { pathname } = request.nextUrl;

      // Skip non API routes
      if (!pathname.startsWith("/api/")) {
        return next(request, event);
      }

      // Security: Strip internal headers that might be spoofed by the client
      const headers = new Headers(request.headers);
      headers.delete("x-user-id");
      headers.delete("x-session-id");

      // Skip public routes
      if (PUBLIC_API_ROUTES.has(pathname)) {
        // Even for public routes, we pass the sanitized headers
        const sanitizedRequest = new NextRequest(request.url, {
          method: request.method,
          headers,
          body: request.body,
          duplex: "half",
        });
        return next(sanitizedRequest, event);
      }

      // Get Authorization header
      const authHeader =
        headers.get("authorization") || headers.get("Authorization");

      if (!authHeader) {
        throw new UnauthorizedError("Unauthorized");
      }

      // Extract token
      const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

      if (!token) {
        throw new UnauthorizedError("Unauthorized");
      }

      // Verify JWT
      const payload = await JWTService.verifyAccessToken(token);

      const sessionId: string = payload.sessionId as string;
      const userId: string = payload.userId as string;

      // Inject verified user info into request headers
      headers.set("x-user-id", userId);
      headers.set("x-session-id", sessionId);

      // Continue request chain
      const modifiedRequest = new NextRequest(request.url, {
        method: request.method,
        headers,
        body: request.body,
        duplex: "half",
      });

      return next(modifiedRequest, event);
    } catch (error) {
      return handleApiErrors(error);
    }
  };
};
