import { EndpointT } from "@securevault/types";

/**
 * Health system endpoint keys.
 * Format: HTTP_METHOD_ACTION
 */
type AppVersionEndpointKeys = "GET_LATEST";

/**
 * Health system API endpoints configuration.
 */
export const APP_VERSION_ENDPOINT: EndpointT<AppVersionEndpointKeys> = {
  GET_LATEST: "/api/app-version/latest",
};
