import { prisma } from "@libs/db/prisma";

export class SyncService {
 static async getChanges(userId: string, since: Date) {
  return await prisma.vault.findMany({
   where: {
    userId,
    updatedAt: { gt: since },
   },
   orderBy: { updatedAt: "asc" }
  });
 }

 static async syncItems(
  userId: string,
  items: Array<{
   id?: string;
   encryptedData: string;
   iv?: string;
   version: number;
   updatedAt: Date;
   deletedAt?: Date | null;
  }>,
 ) {
  const results = [];

  for (const item of items) {
   if (item.id) {
    const existing = await prisma.vault.findUnique({
     where: { id: item.id },
    });

    if (existing) {
     // Last-Write-Wins: only update if incoming is newer
     if (new Date(item.updatedAt) > new Date(existing.updatedAt)) {
      const updated = await prisma.vault.update({
       where: { id: item.id },
       data: {
        encryptedData: item.encryptedData,
        iv: item.iv,
        version: item.version,
        updatedAt: item.updatedAt,
        deletedAt: item.deletedAt,
       },
      });
      results.push({ id: updated.id, status: "updated" });
     } else {
      results.push({ id: existing.id, status: "ignored_older" });
     }
     continue;
    }
   }

   // Create new record
   const created = await prisma.vault.create({
    data: {
     id: item.id,
     userId,
     encryptedData: item.encryptedData,
     iv: item.iv,
     version: item.version,
     updatedAt: item.updatedAt,
     deletedAt: item.deletedAt,
    },
   });
   results.push({ id: created.id, status: "created" });
  }

  return results;
 }
}
