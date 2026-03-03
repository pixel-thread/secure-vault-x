import { prisma } from "@securevault/database";
import { NotFoundError } from "../utils/errors/common";

export class DeviceService {
 static async getDevices(userId: string) {
  return prisma.device.findMany({
   where: { userId },
   select: {
    id: true,
    deviceName: true,
    createdAt: true,
   },
   orderBy: { createdAt: "desc" },
  });
 }

 static async registerDevice(userId: string, deviceName: string) {
  return prisma.device.create({
   data: {
    userId,
    deviceName,
    encryptedMEK: "pending_sync",
   },
   select: {
    id: true,
    deviceName: true,
    createdAt: true,
   },
  });
 }

 static async removeDevice(userId: string, deviceId: string) {
  const device = await prisma.device.findFirst({
   where: { id: deviceId, userId },
  });

  if (!device) throw new NotFoundError("Device not found");

  await prisma.device.delete({ where: { id: deviceId } });
  return { status: "success" };
 }
}
