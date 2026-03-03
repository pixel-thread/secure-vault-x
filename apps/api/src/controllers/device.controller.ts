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
  const deviceId = c.req.param("id");
  const result = await DeviceService.removeDevice(userId, deviceId);
  return sendResponse(c, { data: result });
 }
}
