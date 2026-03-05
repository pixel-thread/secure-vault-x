import { prisma } from "@securevault/database";
import { SignJWT } from "jose";
import crypto from "node:crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_tests");

export const MOCK_USER = {
  email: `test-${Date.now()}@example.com`,
  password: "TestPassword123!",
};

/**
 * Creates a valid test user in the database.
 */
export const createTestUser = async (email = MOCK_USER.email) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return existingUser;

  // In a real scenario we'd hash the password, but some tests might just need the user object
  // For the OWASP suite, we test real flows, so we often register through the API instead.
  // This helper is for when we need deep DB-level spoofing.
  return prisma.user.create({
    data: {
      email,
      passwordHash: "dummy-hash-for-tests", // intentionally fake since we bypass password login here
      mfaEnabled: false,
      encryption: {
        create: {
          salt: "somesalt"
        }
      }
    },
  });
};

/**
 * Generates an arbitrary JWT signed with the app's secret for tampering or spoofing tests.
 */
export const generateSpoofedToken = async (payload: any, secret = JWT_SECRET, algorithm = "HS256") => {
  try {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: algorithm })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);
  } catch (e) {
    // If the algorithm causes jose to throw (e.g. "none"), build it manually
    const header = Buffer.from(JSON.stringify({ alg: algorithm, typ: "JWT" })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${header}.${body}.`;
  }
};

/**
 * Generates a completely invalid JWT string.
 */
export const getMalformedToken = () => {
  return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformedPayload.InvalidSignature123";
};
