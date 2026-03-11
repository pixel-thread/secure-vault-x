import { stackMiddlewares } from "./utils/middleware/stackMiddleware";
import { withSecurityHeaders } from "./utils/middleware/withSecurityHeaders";
import { withRateLimiting } from "./utils/middleware/withRateLimiting";
import { withAuth } from "./utils/middleware/withAuth";
import { withLogger } from "./utils/middleware/withLogger";

export default stackMiddlewares([
  withLogger,
  withSecurityHeaders,
  withRateLimiting,
  withAuth,
]);

export const config = {
  matcher: "/api/:path*",
};
