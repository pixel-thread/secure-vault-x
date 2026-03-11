import { NextRequest } from "next/server";
import { MiddlewareFactory } from "./stackMiddleware";
import { handleApiErrors } from "../errors/handleApiErrors";
import { UnauthorizedError } from "../errors/unAuthError";
import { JWTService } from "@/services/jwt.services";

const PUBLIC_API_ROUTES = new Set([
  "/api/auth/register/generate-options",
  "/api/auth/register/verify",
  "/api/auth/login/generate-options",
  "/api/auth/login/verify",
  "/api/auth/password/register",
  "/api/auth/password/login",
  "/api/auth/mfa/verify",
  "/api/auth/refresh",
  "/api/logs",
]);

export const withAuth: MiddlewareFactory = (next) => {
  return async (request: NextRequest, event) => {
    try {
      const { pathname } = request.nextUrl;

      // Skip non API routes
      if (!pathname.startsWith("/api/")) {
        return next(request, event);
      }

      // Skip public routes
      if (PUBLIC_API_ROUTES.has(pathname)) {
        return next(request, event);
      }

      // Get Authorization header
      const authHeader =
        request.headers.get("authorization") ||
        request.headers.get("Authorization");

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
      // Inject user info into request headers
      const headers = new Headers(request.headers);
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
