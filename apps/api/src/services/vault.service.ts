import { prisma } from "@securevault/database";
import { BadRequestError, ConflictError } from "../utils/errors/common";

export class VaultService {
  static async getVault(userId: string) {
    const vaults = await prisma.vault.findMany({ where: { userId } });
    if (vaults.length === 0) return { encryptedData: null, version: 0 };
    return vaults.map((vault) => ({
      encryptedData: vault.encryptedData,
      iv: vault.iv,
    }));
  }

  static async syncVault(
    userId: string,
    encryptedData: string,
    version: number,
  ) {
    if (!encryptedData || typeof version !== "number") {
      throw new BadRequestError("Invalid payload structure");
    }

    const existingVault = await prisma.vault.findFirst({ where: { userId } });

    if (existingVault) {
      if (version <= existingVault.version) {
        throw new ConflictError(
          "Conflict: Client version is behind server. Current Version: " +
          existingVault.version,
        );
      }
      const updated = await prisma.vault.update({
        where: { id: existingVault.id, userId },
        data: { encryptedData, version },
      });
      return { status: "success", version: updated.version };
    }

    const newVault = await prisma.vault.create({
      data: { userId, encryptedData, version: 1 },
    });

    return { status: "success", version: newVault.version };
  }

  static async addSecret(
    userId: string,
    data: { encryptedData: string; iv: string },
  ) {
    const { encryptedData, iv } = data;
    return await prisma.vault.create({
      data: { encryptedData, userId, iv },
    });
  }
}
