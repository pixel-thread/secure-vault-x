import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { randomBytes } from "@noble/hashes/utils";

export interface DerivedKey {
  mek: Uint8Array;
  salt: Uint8Array;
}

const ITERATIONS = 310000; // As per your security spec
const KEY_LENGTH = 32; // 256 bits

/**
 * Generates a new MEK and Salt for a new user
 */
export async function generateInitialMEK(
  password: string,
): Promise<DerivedKey> {
  const salt = randomBytes(16); // Generate 128-bit random salt
  const mek = pbkdf2(sha256, password, salt, {
    c: ITERATIONS,
    dkLen: KEY_LENGTH,
  });

  return { mek, salt };
}

/**
 * Re-generates the MEK using a password and a retrieved salt (Recovery Flow)
 */
export async function recoverMEK(
  password: string,
  salt: Uint8Array,
): Promise<Uint8Array> {
  return pbkdf2(sha256, password, salt, { c: ITERATIONS, dkLen: KEY_LENGTH });
}
