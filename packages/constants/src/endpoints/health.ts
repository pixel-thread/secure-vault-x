import { EndpointT } from "@securevault/types";

/**
 * Health system endpoint keys.
 * Format: HTTP_METHOD_ACTION
 */
type HealthEndpointKeys = "GET_STATUS";

/**
 * Health system API endpoints configuration.
 */
export const HEALTH_ENDPOINT: EndpointT<HealthEndpointKeys> = {
 GET_STATUS: "/api/health",
};
