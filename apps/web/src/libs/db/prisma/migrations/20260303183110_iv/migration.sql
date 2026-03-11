/*
  Warnings:

  - A unique constraint covering the columns `[iv]` on the table `Vault` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Vault" ADD COLUMN     "iv" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Vault_iv_key" ON "Vault"("iv");
