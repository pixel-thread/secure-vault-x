import { Context } from "hono";
import { DeviceService } from "../services/device.service";
import { sendResponse } from "../utils/helper/response";
import { AuditLogger } from "../services/audit.service";

export class DeviceController {
  static async getDevices(c: Context) {
    const userId = c.get("userId") as string;
    const devices = await DeviceService.getDevices(userId);
    return sendResponse(c, { data: devices });
  }

  static async registerDevice(c: Context) {
    const userId = c.get("userId") as string;
    const sessionId = c.get("sessionId") as string | undefined;
    const { deviceName, publicKey, deviceIdentifier } = await c.req.json();
    const device = await DeviceService.registerDevice(
      userId,
      deviceName,
      publicKey,
      sessionId,
      deviceIdentifier
    );

    await AuditLogger.log({
      userId,
      action: "DEVICE_REGISTER",
      ip: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { deviceName, deviceId: device.id }
    });

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
    const signature = c.req.header("X-Device-Signature");
    const timestamp = c.req.header("X-Timestamp");

    const result = await DeviceService.removeDevice(
      userId,
      deviceId,
      actingDeviceId,
      signature,
      timestamp,
    );

    await AuditLogger.log({
      userId,
      action: "DEVICE_REMOVE",
      ip: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { targetDeviceId: deviceId, actingDeviceId }
    });

    return sendResponse(c, { data: result });
  }

  static async updateTrustStatus(c: Context) {
    const userId = c.get("userId") as string;
    const targetDeviceId = c.req.param("id");
    const { isTrusted } = await c.req.json();
    const actingDeviceId = c.req.header("X-Device-Id");
    const signature = c.req.header("X-Device-Signature");
    const timestamp = c.req.header("X-Timestamp");

    if (!actingDeviceId || !signature || !timestamp) {
      throw new Error(
        "Cryptographic headers (X-Device-Id, X-Device-Signature, X-Timestamp) are required to change trust status.",
      );
    }

    const result = await DeviceService.updateTrustStatus(
      userId,
      targetDeviceId,
      isTrusted,
      actingDeviceId,
      signature,
      timestamp,
    );

    await AuditLogger.log({
      userId,
      action: "DEVICE_TRUST_UPDATE",
      ip: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { targetDeviceId, isTrusted, actingDeviceId }
    });

    return sendResponse(c, { data: result });
  }
}
