import { Context } from "hono";
import { DeviceService } from "../services/device.service";
import { sendResponse } from "../utils/helper/response";

export class DeviceController {
  static async getDevices(c: Context) {
    const userId = c.get("userId") as string;
    const devices = await DeviceService.getDevices(userId);
    return sendResponse(c, { data: devices });
  }

  static async registerDevice(c: Context) {
    const userId = c.get("userId") as string;
    const { deviceName } = await c.req.json();
    const device = await DeviceService.registerDevice(userId, deviceName);
    return sendResponse(c, { data: device, status: 201 });
  }

  static async removeDevice(c: Context) {
    const userId = c.get("userId") as string;
    // params /decies/:id/** will be available as `c.req.param("id")`
    const deviceId = c.req.param("id");

    // In a real app this would come from a verified token/cookie tied to the current device
    // For this implementation, we accept it from headers or body for the trusted logic check
    // TODO: This is insecure
    const actingDeviceId = c.req.header("X-Device-Id");

    const result = await DeviceService.removeDevice(
      userId,
      deviceId,
      actingDeviceId,
    );
    return sendResponse(c, { data: result });
  }

  static async updateTrustStatus(c: Context) {
    const userId = c.get("userId") as string;
    const targetDeviceId = c.req.param("id");
    const { isTrusted } = await c.req.json();
    const actingDeviceId = c.req.header("X-Device-Id");

    if (!actingDeviceId) {
      throw new Error(
        "actingDeviceId (X-Device-Id header) is required to change trust status.",
      );
    }

    const result = await DeviceService.updateTrustStatus(
      userId,
      targetDeviceId,
      isTrusted,
      actingDeviceId,
    );
    return sendResponse(c, { data: result });
  }
}
