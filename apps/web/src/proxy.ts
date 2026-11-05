import { stackMiddlewares } from "./utils/middleware/stackMiddleware";
import { withSecurityHeaders } from "./utils/middleware/withSecurityHeaders";
import { withAuth } from "./utils/middleware/withAuth";

export default stackMiddlewares([withAuth, withSecurityHeaders]);

export const config = {
  matcher: "/api/:path*",
};
