import { prisma } from "@libs/db/prisma";

export class VaultService {
  static async getVault(userId: string) {
    const vaults = await prisma.vault.findMany({
      where: { userId, deletedAt: null },
    });

    return vaults.map((vault) => ({
      id: vault.id,
      encryptedData: vault.encryptedData,
      iv: vault.iv,
      version: vault.version,
      updatedAt: vault.updatedAt,
    }));
  }

  static async addSecret(
    userId: string,
    data: { encryptedData: string; iv: string },
  ) {
    const { encryptedData, iv } = data;
    return await prisma.vault.create({
      data: { encryptedData, userId, iv, version: 1 },
    });
  }

  static async updateSecret(
    userId: string,
    id: string,
    data: { encryptedData: string; iv: string; version: number },
  ) {
    const { encryptedData, iv, version } = data;
    return await prisma.vault.update({
      where: { id, userId },
      data: { encryptedData, iv, version },
    });
  }
}
