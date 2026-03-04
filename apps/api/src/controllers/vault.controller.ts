import { Context } from "hono";
import { VaultService } from "../services/vault.service";
import { sendResponse } from "../utils/helper/response";

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
    const { encryptedData, version } = c.req.valid("json" as any);

    const result = await VaultService.syncVault(userId, encryptedData, version);
    return sendResponse(c, { data: result });
  }

  static async addSecret(c: Context) {
    const userId = c.get("userId") as string;
    const { encryptedData, iv } = c.req.valid("json" as any);

    const data = { encryptedData, iv };

    await VaultService.addSecret(userId, data);
    return sendResponse(c, { message: "Secret added successfully" });
  }
}
