import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { UnauthorizedError } from "../utils/errors/unauthorize";

const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}

const JWT_SECRET = new TextEncoder().encode(
  JWT_SECRET_STRING || "dev-only-secret-key-12345",
);

export const protect = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError("Unauthorized")
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new UnauthorizedError("Unauthorized")
  }

  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: "securevault-api",
    audience: "securevault-client",
  });
  c.set("userId", payload.userId);
  c.set("sessionId", payload.sessionId);
  await next();
}