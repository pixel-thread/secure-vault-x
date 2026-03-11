-- DropIndex
DROP INDEX "Vault_iv_key";

-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "isTrusted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicKey" TEXT;

-- AlterTable
ALTER TABLE "Vault" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Vault_userId_idx" ON "Vault"("userId");

-- CreateIndex
CREATE INDEX "Vault_id_idx" ON "Vault"("id");

-- CreateIndex
CREATE INDEX "Vault_userId_iv_idx" ON "Vault"("userId", "iv");
