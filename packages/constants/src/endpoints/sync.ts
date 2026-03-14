import { EndpointT } from "@securevault/types";

/**
 * Sync endpoint keys.
 */
type SyncEndpointKeys = "GET_SYNC" | "POST_SYNC_PUSH";

/**
 * Sync API endpoints configuration.
 */
export const SYNC_ENDPOINT: EndpointT<SyncEndpointKeys> = {
  GET_SYNC: "/api/sync?since=:since",
  POST_SYNC_PUSH: "/api/sync/push",
};
