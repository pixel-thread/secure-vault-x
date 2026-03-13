import { ErrorResponse } from "@/utils/next-response";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/utils/errors/unAuthError";
import { errors as JoseErrors } from "jose";
// Removed Prisma and logger imports for Edge compatibility in middleware
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "./common";
import { logger } from "../logger";

const isJwtError = (error: unknown): boolean => {
  const isJoseClass =
    error instanceof JoseErrors.JOSEError ||
    error instanceof JoseErrors.JWTExpired ||
    error instanceof JoseErrors.JWTInvalid ||
    error instanceof JoseErrors.JWSSignatureVerificationFailed ||
    error instanceof JoseErrors.JWTClaimValidationFailed ||
    error instanceof JoseErrors.JWSInvalid ||
    error instanceof JoseErrors.JWKSInvalid ||
    error instanceof JoseErrors.JWKSTimeout ||
    error instanceof JoseErrors.JWKInvalid ||
    error instanceof JoseErrors.JOSEAlgNotAllowed ||
    error instanceof JoseErrors.JOSENotSupported ||
    error instanceof JoseErrors.JWEInvalid ||
    error instanceof JoseErrors.JWEDecryptionFailed;

  if (isJoseClass) return true;

  if (error instanceof TypeError || error instanceof Error) {
    const msg = error.message;
    return (
      msg.includes("jose") ||
      msg.includes("JWT") ||
      msg.includes("JWK") ||
      msg.includes("algorithm") ||
      msg.includes("CryptoKey")
    );
  }

  return false;
};

export const handleApiErrors = (error: unknown) => {
  if (process.env.NODE_ENV === "development") {
    logger.log("Logs", JSON.stringify(error, null, 2));
  }

  if (isJwtError(error)) {
    return ErrorResponse({
      message: "Unauthorized",
      status: 401,
    });
  }

  if (error instanceof UnauthorizedError) {
    return ErrorResponse({
      message: error.message || "Unauthorized",
      status: 401,
    });
  }

  if (error instanceof ZodError || error?.constructor?.name === "ZodError") {
    return ErrorResponse({
      message: (error as ZodError)?.issues?.[0]?.message || "Validation error",
      status: 400,
    });
  }

  if (error instanceof NotFoundError) {
    return ErrorResponse({
      message: error.message,
      status: 404,
    });
  }

  if (error instanceof ConflictError) {
    return ErrorResponse({
      message: error.message,
      status: 409,
    });
  }

  if (error instanceof ForbiddenError) {
    return ErrorResponse({
      message: error.message,
      status: 403,
    });
  }

  if (error instanceof BadRequestError) {
    return ErrorResponse({
      message: error.message,
      status: 400,
    });
  }

  // Prisma errors - check by constructor name to avoid importing Prisma in Edge
  const err = error as any;
  if (
    err?.constructor?.name?.startsWith("PrismaClient") ||
    err?.code?.startsWith("P")
  ) {
    const message =
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Database Error";
    return ErrorResponse({
      message,
      status: 500,
    });
  }

  if (error instanceof Error) {
    const message =
      process.env.NODE_ENV === "development"
        ? error.message
        : "Internal Server Error";
    return ErrorResponse({
      message,
      status: 500,
    });
  }

  return ErrorResponse({
    message: "Internal Server Error",
    status: 500,
  });
};
