import { Context } from "hono";
import { ZodError } from "zod";
import { UnauthorizedError } from "../utils/errors/unauthorize";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors/common";
import { errorResponse } from "../utils/helper/response";

export const errorHandler = (err: Error, c: Context) => {
  console.log(err);
  // Handle Unauthorized (401)
  if (err instanceof UnauthorizedError) {
    return errorResponse(c, {
      status: 401,
      message: "Unauthorized",
    });
  }

  if (
    err.name === "JWSSignatureVerificationFailed" ||
    err.name === "JWTExpired" ||
    err.name === "JWTClaimValidationFailed" ||
    err.name === "JWTInvalid"
  ) {
    return errorResponse(c, {
      status: 401,
      message: "Unauthorized access or session expired",
      error:
        process.env.NODE_ENV === "development" ? { detail: err.message } : null,
    });
  }

  if (err instanceof UnauthorizedError) {
    console.log(err);
    return errorResponse(c, {
      status: 401,
      message: "Unauthorized",
    });
  }

  // Handle Forbidden (403)
  if (err instanceof ForbiddenError) {
    return errorResponse(c, {
      status: 403,
      message: err.message || "Forbidden resource",
    });
  }

  // Handle Bad Request (400)
  if (err instanceof BadRequestError) {
    return errorResponse(c, {
      status: 400,
      message: err.message,
    });
  }

  // Handle Conflict (409)
  if (err instanceof ConflictError) {
    return errorResponse(c, {
      status: 409,
      message: err.message,
    });
  }

  // Handle Not Found (404)
  if (err instanceof NotFoundError) {
    return errorResponse(c, {
      status: 404,
      message: err.message,
    });
  }

  // Handle Zod Validation (400)
  if (err instanceof ZodError) {
    return errorResponse(c, {
      status: 400,
      message: "Request validation failed",
      error: {
        issues: err.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
          code: i.code,
        })),
      },
    });
  }

  // Prisma unique constraint violation (Conflict)
  if (
    err.name === "PrismaClientKnownRequestError" &&
    (err as any).code === "P2002"
  ) {
    return errorResponse(c, {
      status: 409,
      message: "Record already exists",
    });
  }

  // Generic Internal Error (500)
  console.error(`[Error Handler]: ${err.stack || err.message}`);

  return errorResponse(c, {
    status: 500,
    message: err.message || "An unexpected error occurred",
    error:
      process.env.NODE_ENV === "development" ? { detail: err.message } : null,
  });
};
