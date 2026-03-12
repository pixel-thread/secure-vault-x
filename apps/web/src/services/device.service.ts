import { prisma } from "@libs/db/prisma";
import { BadRequestError, NotFoundError } from "@/utils/errors/common";
import { verifyDeviceSignature } from "@securevault/crypto";

export class DeviceService {
  static async getDevices(userId: string) {
    return prisma.device.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        isTrusted: true,
        createdAt: true,
        deviceIdentifier: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async registerDevice(
    userId: string,
    deviceName: string,
    publicKey?: string,
    sessionId?: string,
    deviceIdentifier?: string,
  ) {
    // Check if this is the first device for the user
    const existingCount = await prisma.device.count({ where: { userId } });
    const isFirstDevice = existingCount === 0;

    if (deviceIdentifier) {
      const existingDevice = await prisma.device.findFirst({
        where: { userId, deviceIdentifier },
      });

      if (existingDevice) {
        // Upsert existing device matching hardware ID
        return prisma.device.update({
          where: { id: existingDevice.id },
          data: {
            deviceName,
            publicKey: publicKey || null,
            refreshTokens: sessionId
              ? {
                  connect: { id: sessionId },
                }
              : undefined,
          },
          select: {
            id: true,
            deviceName: true,
            isTrusted: true,
            createdAt: true,
          },
        });
      }

      // If no device matches the hardware ID, check if there's a legacy device with a null ID
      // that we can safely "adopt" to prevent duplicate spawning for users who updated the app.
      const legacyDevice = await prisma.device.findFirst({
        where: { userId, deviceIdentifier: null },
        orderBy: { createdAt: "asc" }, // Adopt the oldest (likely primary/trusted) legacy device
      });

      if (legacyDevice) {
        return prisma.device.update({
          where: { id: legacyDevice.id },
          data: {
            deviceIdentifier,
            deviceName,
            publicKey: publicKey || null,
            refreshTokens: sessionId
              ? {
                  connect: { id: sessionId },
                }
              : undefined,
          },
          select: {
            id: true,
            deviceName: true,
            isTrusted: true,
            createdAt: true,
          },
        });
      }
    }

    // Create new device if not matched by ID
    return prisma.device.create({
      data: {
        userId,
        deviceName,
        deviceIdentifier,
        publicKey: publicKey || null,
        encryptedMEK: "",
        isTrusted: isFirstDevice, // First device is auto-trusted
        refreshTokens: sessionId
          ? {
              connect: { id: sessionId },
            }
          : undefined,
      },
      select: {
        id: true,
        deviceName: true,
        isTrusted: true,
        createdAt: true,
      },
    });
  }

  static async removeDevice(
    userId: string,
    deviceId: string,
    actingDeviceId?: string,
    signature?: string,
    timestamp?: string,
  ) {
    // ALWAYS require actingDeviceId and signature for removal (unless removing self, optionally)
    // For now, let's strictly require them for all fleet management.
    if (!actingDeviceId || !signature || !timestamp) {
      throw new Error(
        "Only a trusted device with a valid signature can remove other devices.",
      );
    }

    if (actingDeviceId && signature && timestamp) {
      // Defend against replay attacks (e.g. 5 minutes window)
      const now = Date.now();
      const reqTime = parseInt(timestamp, 10);
      if (isNaN(reqTime) || Math.abs(now - reqTime) > 5 * 60 * 1000) {
        throw new Error("Request timestamp is expired or invalid.");
      }

      const actingDevice = await prisma.device.findFirst({
        where: { id: actingDeviceId, userId },
      });

      if (!actingDevice || !actingDevice.isTrusted) {
        throw new Error("Only a trusted device can remove other devices.");
      }

      if (!actingDevice.publicKey) {
        throw new Error(
          "Acting device does not have a cryptographic public key registered.",
        );
      }

      // Payload definition: `${userId}:${deviceId}:REMOVE:${timestamp}`
      const payloadToVerify = `${userId}:${deviceId}:REMOVE:${timestamp}`;
      const isValid = await verifyDeviceSignature(
        payloadToVerify,
        signature,
        actingDevice.publicKey,
      );

      if (!isValid) {
        throw new BadRequestError("Invalid device signature. Action denied.");
      }
    }

    const device = await prisma.device.findFirst({
      where: { id: deviceId, userId },
    });

    // revoked user token link to this device when device is removed
    await prisma.refreshToken.updateMany({
      where: { deviceId, revoked: false },
      data: { revoked: true },
    });

    if (!device) throw new NotFoundError("Device not found");

    await prisma.device.delete({ where: { id: deviceId, userId } });
    return { status: "success" };
  }

  static async updateTrustStatus(
    userId: string,
    targetDeviceId: string,
    isTrusted: boolean,
    actingDeviceId: string,
    signature: string,
    timestamp: string,
  ) {
    // Defend against replay attacks (e.g. 5 minutes window)
    const now = Date.now();
    const reqTime = parseInt(timestamp, 10);
    if (isNaN(reqTime) || Math.abs(now - reqTime) > 5 * 60 * 1000) {
      throw new Error("Request timestamp is expired or invalid.");
    }

    const actingDevice = await prisma.device.findFirst({
      where: { id: actingDeviceId, userId },
    });

    if (!actingDevice || !actingDevice.isTrusted) {
      throw new Error("Only a trusted device can change trust status.");
    }

    if (actingDeviceId === targetDeviceId) {
      throw new Error("A device cannot change its own trust status.");
    }

    if (!actingDevice.publicKey) {
      throw new Error(
        "Acting device does not have a cryptographic public key registered.",
      );
    }

    // Payload definition: `${userId}:${targetDeviceId}:${isTrusted}:${timestamp}`
    const payloadToVerify = `${userId}:${targetDeviceId}:${isTrusted}:${timestamp}`;

    const isValid = await verifyDeviceSignature(
      payloadToVerify,
      signature,
      actingDevice.publicKey,
    );

    if (!isValid) {
      throw new Error("Invalid device signature. Action denied.");
    }

    const targetDevice = await prisma.device.findFirst({
      where: { id: targetDeviceId, userId },
    });

    if (!targetDevice) throw new NotFoundError("Target device not found");

    return prisma.device.update({
      where: { id: targetDeviceId, userId },
      data: { isTrusted },
      select: { id: true, deviceName: true, isTrusted: true, createdAt: true },
    });
  }
}
