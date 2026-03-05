import { Context } from "hono";
import { VaultService } from "../services/vault.service";
import { sendResponse } from "../utils/helper/response";
import { AuditLogger } from "../services/audit.service";

export class VaultController {
  // Sync Down (Fetch latest vault)
  static async getVault(c: Context) {
    const userId = c.get("userId") as string;
    const vault = await VaultService.getVault(userId);
    return sendResponse(c, { data: vault });
  }

  // Sync Up (Push encrypted vault)
  static async syncVault(c: Context) {
    const userId = c.get("userId") as string;
    const { encryptedData, version } = await c.req.json();

    const result = await VaultService.syncVault(userId, encryptedData, version);

    await AuditLogger.log({
      userId,
      action: "VAULT_SYNC",
      ip: c.req.header("x-forwarded-for") || "unknown",
      userAgent: c.req.header("user-agent"),
      metadata: { version }
    });

    return sendResponse(c, { data: result });
  }

  static async addSecret(c: Context) {
    const userId = c.get("userId") as string;
    const { encryptedData, iv } = await c.req.json();

    const data = { encryptedData, iv };

    await VaultService.addSecret(userId, data);
    return sendResponse(c, { message: "Secret added successfully" });
  }
}
