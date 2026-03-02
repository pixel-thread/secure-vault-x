import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { syncVaultSchema } from "@securevault/validators";
import { VAULT_ENDPOINT } from "@securevault/constants";
import { VaultController } from "../controllers/vault.controller";
import { protect } from "../middlewares/auth.middleware";

const vaultRouter = new Hono();

// Every Vault Route requires Authentication
vaultRouter.use("/api/vault", protect);
vaultRouter.use("/api/vault/*", protect);

vaultRouter.get(VAULT_ENDPOINT.GET_VAULT, VaultController.getVault);
vaultRouter.post(
  VAULT_ENDPOINT.POST_SYNC_VAULT,
  zValidator("json", syncVaultSchema),
  VaultController.syncVault,
);

export { vaultRouter };
