import { ErrorResponse } from "@/utils/next-response";
import { ZodError } from "zod";
import { UnauthorizedError } from "@/utils/errors/unAuthError";
import { Prisma } from "@securevault/database";
import * as JoseErrors from "jose/errors";

/**
 * Checks if an error is a specific JWT/JWS/JWE error thrown by the 'jose' library.
 */

const isJwtError = (error: unknown): boolean => {
  // Check if it's an explicit Jose subclass
  const isJoseClass =
    error instanceof JoseErrors.JOSEError || // Base class for all jose-specific errors
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
    error instanceof JoseErrors.JWSSignatureVerificationFailed ||
    error instanceof JoseErrors.JWEInvalid ||
    error instanceof JoseErrors.JWEDecryptionFailed;

  if (isJoseClass) return true;

  // Catch the specific "none algorithm" TypeErrors thrown by jose
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
  if (isJwtError(error)) {
    return ErrorResponse({
      message: "Unauthorized",
      status: 401,
    });
  }

  if (error instanceof UnauthorizedError) {
    return ErrorResponse({
      message: error.message || "Unauthorized",
      status: error.status,
    });
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return ErrorResponse({ message: "Bad Request", status: 400 });
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ErrorResponse({ message: "Bad Request", status: 400 });
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return ErrorResponse({ message: "Bad Request", status: 400 });
  }

  if (error instanceof ZodError) {
    return ErrorResponse({
      message: error?.issues[0]?.message,
      status: 400,
    });
  }

  if (error instanceof Error) {
    return ErrorResponse({ message: error.message });
  }

  return ErrorResponse({ message: "Internal Server Error", status: 500 });
};
