import { prisma } from "@securevault/database";
import { NotFoundError } from "../utils/errors/common";

export class DeviceService {
 static async getDevices(userId: string) {
  return prisma.device.findMany({
   where: { userId },
   select: {
    id: true,
    deviceName: true,
    isTrusted: true,
    createdAt: true,
   },
   orderBy: { createdAt: "desc" },
  });
 }

 static async registerDevice(userId: string, deviceName: string) {
  // Check if this is the first device for the user
  const existingCount = await prisma.device.count({ where: { userId } });
  const isFirstDevice = existingCount === 0;

  return prisma.device.create({
   data: {
    userId,
    deviceName,
    encryptedMEK: "pending_sync",
    isTrusted: isFirstDevice, // First device is auto-trusted
   },
   select: {
    id: true,
    deviceName: true,
    isTrusted: true,
    createdAt: true,
   },
  });
 }

 static async removeDevice(userId: string, deviceId: string, actingDeviceId?: string) {
  // If actingDeviceId is provided, verify it is a trusted device
  if (actingDeviceId) {
   const actingDevice = await prisma.device.findFirst({
    where: { id: actingDeviceId, userId },
   });
   if (!actingDevice || !actingDevice.isTrusted) {
    throw new Error("Only a trusted device can remove other devices.");
   }
  }

  const device = await prisma.device.findFirst({
   where: { id: deviceId, userId },
  });

  if (!device) throw new NotFoundError("Device not found");

  await prisma.device.delete({ where: { id: deviceId } });
  return { status: "success" };
 }

 static async updateTrustStatus(userId: string, targetDeviceId: string, isTrusted: boolean, actingDeviceId: string) {
  const actingDevice = await prisma.device.findFirst({
   where: { id: actingDeviceId, userId },
  });

  if (!actingDevice || !actingDevice.isTrusted) {
   throw new Error("Only a trusted device can change trust status.");
  }

  if (actingDeviceId === targetDeviceId) {
   throw new Error("A device cannot change its own trust status.");
  }

  const targetDevice = await prisma.device.findFirst({
   where: { id: targetDeviceId, userId },
  });

  if (!targetDevice) throw new NotFoundError("Target device not found");

  return prisma.device.update({
   where: { id: targetDeviceId },
   data: { isTrusted },
   select: { id: true, deviceName: true, isTrusted: true, createdAt: true },
  });
 }
}
