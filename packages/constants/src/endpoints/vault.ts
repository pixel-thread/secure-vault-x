import { EndpointT } from "@securevault/types";

/**
 * Vault management endpoint keys.
 * Format: HTTP_METHOD_ACTION
 */
type VaultEndpointKeys = "GET_VAULT" | "POST_SYNC_VAULT" | "POST_ADD_SECRET";

/**
 * Vault management API endpoints configuration.
 */
export const VAULT_ENDPOINT: EndpointT<VaultEndpointKeys> = {
 GET_VAULT: "/api/vault",
 POST_SYNC_VAULT: "/api/vault",
 POST_ADD_SECRET: "/api/vault/add",
};
