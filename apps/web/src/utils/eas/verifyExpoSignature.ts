import crypto from "crypto";
import { logger } from "../logger";

/**
 * Verifies the signature of an Expo webhook request.
 * @param body The raw request body as a string.
 * @param signature The signature from the 'expo-signature' header.
 * @returns True if the signature is valid, false otherwise.
 */
export const verifyExpoSignature = (
  body: string,
  signature: string | null,
): boolean => {
  if (!signature) {
    return false;
  }

  const secret = process.env.EAS_WEBHOOK_SECRET;
  if (!secret) {
    logger.error("EAS_WEBHOOK_SECRET is not set");
    return false;
  }

  const hmac = crypto.createHmac("sha1", secret);
  hmac.update(body);
  const expectedSignature = `sha1=${hmac.digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
};
