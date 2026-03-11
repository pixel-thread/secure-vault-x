import { NextRequest } from "next/server";
import { MiddlewareFactory } from "./stackMiddleware";

export const withSecurityHeaders: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next) => {
    const response = await next(request, _next);

    if (response) {
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set(
        "Referrer-Policy",
        "strict-origin-when-cross-origin",
      );
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
      );
    }

    return response;
  };
};
