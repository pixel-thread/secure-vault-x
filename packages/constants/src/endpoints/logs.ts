import { EndpointT } from "@securevault/types";

/**
 * Health system endpoint keys.
 * Format: HTTP_METHOD_ACTION
 */
type LogsEndpointKeys = "POST_LOGS";

/**
 * Health system API endpoints configuration.
 */
export const LOG_ENDPOINT: EndpointT<LogsEndpointKeys> = {
  POST_LOGS: "/api/logs",
};
