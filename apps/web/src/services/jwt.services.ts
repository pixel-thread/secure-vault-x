import { jwtVerify } from "jose";

const JWT_SECRET_STRING = process.env.JWT_SECRET;

if (!JWT_SECRET_STRING) {
  throw new Error("JWT_SECRET must be set in all environments");
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export class JWTService {
  static async verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "securevault-api",
      audience: "securevault-client",
    });
    return payload;
  }

  static async verifyRefreshToken(token: string) {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "securevault-api",
      audience: "securevault-client",
    });
    return payload;
  }
}
