import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { addSecretSchema, syncVaultSchema } from "@securevault/validators";
import { VAULT_ENDPOINT } from "@securevault/constants";
import { VaultController } from "../controllers/vault.controller";
import { protect } from "../middlewares/auth.middleware";
import { errorHandler } from "../middlewares/error.middleware";
import { validatorHook } from "../utils/helper/validator";

const vaultRouter = new Hono();
vaultRouter.onError(errorHandler);

// Every Vault Route requires Authentication
vaultRouter.use("/api/vault", protect);
vaultRouter.use("/api/vault/*", protect);

vaultRouter.get(VAULT_ENDPOINT.GET_VAULT, VaultController.getVault);

vaultRouter.post(
  VAULT_ENDPOINT.POST_SYNC_VAULT,
  zValidator("json", syncVaultSchema, validatorHook),
  VaultController.syncVault,
);

vaultRouter.post(
  VAULT_ENDPOINT.POST_ADD_SECRET,
  zValidator("json", addSecretSchema, validatorHook),
  VaultController.addSecret,
);

export { vaultRouter };
