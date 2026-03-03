import { EndpointT } from "@securevault/types";

/**
 * Device management endpoint keys.
 */
type DeviceEndpointKeys =
 | "GET_DEVICES"
 | "POST_REGISTER_DEVICE"
 | "DELETE_DEVICE";

/**
 * Device management API endpoints configuration.
 */
export const DEVICE_ENDPOINT: EndpointT<DeviceEndpointKeys> = {
 GET_DEVICES: "/api/devices",
 POST_REGISTER_DEVICE: "/api/devices",
 DELETE_DEVICE: "/api/devices/:id",
};
