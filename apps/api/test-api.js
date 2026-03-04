const { SignJWT } = require("jose");
const crypto = require("node:crypto");

async function test() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "mysecret");
  const token = await new SignJWT({ userId: "123", email: "test@test.com", sessionId: "456" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("securevault-api")
      .setAudience("securevault-client")
      .setIssuedAt()
      .setExpirationTime("-15m") // Expired
      .sign(secret);
  
  console.log("Token: ", token);
}
test();
