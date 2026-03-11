import { NextRequest } from "next/server";
import { MiddlewareFactory } from "./stackMiddleware";

export const withLogger: MiddlewareFactory = (next) => {
  return async (request: NextRequest, _next) => {
    const method = request.method;
    const url = request.url;
    console.log(JSON.stringify({ method, url }, null, 2));
    return await next(request, _next);
  };
};
