import { stackMiddlewares } from "./utils/middleware/stackMiddleware";
import { withSecurityHeaders } from "./utils/middleware/withSecurityHeaders";
import { withRateLimiting } from "./utils/middleware/withRateLimiting";
import { withAuth } from "./utils/middleware/withAuth";

export default stackMiddlewares([
  withSecurityHeaders,
  withRateLimiting,
  withAuth,
]);

export const config = {
  matcher: "/api/:path*",
};
