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
    const { encryptedData, version } = await c.req.json();

    const result = await VaultService.syncVault(userId, encryptedData, version);
    return sendResponse(c, { data: result });
  }

  static async addSecret(c: Context) {
    const userId = c.get("userId") as string;
    const { encryptedData } = await c.req.json();

    await VaultService.addSecret(userId, encryptedData);
    return sendResponse(c, { message: "Secret added successfully" });
  }
}
