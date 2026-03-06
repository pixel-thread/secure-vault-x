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
  if (process.env.NODE_ENV !== "production") {
    if (err.stack)
      console.error("Debug Dev", JSON.stringify(err.stack, null, 2));
  }

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
    err.name === "JWTInvalid" ||
    err.name === "JWSInvalid" ||
    err.name === "JOSEAlgNotAllowed" ||
    (err instanceof TypeError &&
      err.message.includes("Key for the none algorithm"))
  ) {
    return errorResponse(c, {
      status: 401,
      message: "Unauthorized access or session expired",
      error:
        process.env.NODE_ENV === "development" ? { detail: err.message } : null,
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
      error: err.issues,
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

  // Handle SyntaxError (e.g. malformed JSON)
  if (
    err instanceof SyntaxError ||
    err.name === "SyntaxError" ||
    err.message?.includes("Malformed JSON in request body")
  ) {
    return errorResponse(c, {
      status: 400,
      message: "Malformed JSON payload or invalid syntax",
    });
  }

  // Generic Internal Error (500)

  return errorResponse(c, {
    status: 500,
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : err.message || "An unexpected error occurred",
    error:
      process.env.NODE_ENV === "development" ? { detail: err.message } : null,
  });
};
