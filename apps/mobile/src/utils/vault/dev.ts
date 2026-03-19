import { DeviceStoreManager } from '@store/device';
import { encryptData } from '@securevault/crypto';
import * as Crypto from 'expo-crypto';
import { logger } from '@securevault/utils-native';

/**
 * Seed the vault with mock items for development and testing.
 *
 * Generates `count` mock entries (every 10th entry is a card, others are password/secret entries), encrypts each payload with the device MEK, and persists them by calling `addVaultItem` for every item.
 *
 * @param addVaultItem - Called for each persisted item with an object containing `id`, `encryptedData`, and `iv`
 * @param count - Number of items to generate (default 10)
 * @throws Error if the device MEK is not available in the device store
 */
export async function seedVaultItems(
  addVaultItem: (item: { id: string; encryptedData: string; iv: string }) => Promise<void>,
  count: number = 100
) {
  const mek = await DeviceStoreManager.getMek();

  if (!mek) {
    throw new Error(
      'MEK not found in device store. Please ensure you are logged in and have set up your vault.'
    );
  }

  const promises = Array.from({ length: count }).map(async (_, i) => {
    const id = Crypto.randomUUID();
    const isCard = i % 10 === 0; // Every 10th item is a card

    const data = isCard
      ? {
          serviceName: `Dev Card ${i / 10 + 1}`,
          cardholderName: `Tester ${i + 1}`,
          cardNumber: `4111${Math.floor(Math.random() * 8999) + 1000}${Math.floor(Math.random() * 8999) + 1000}${Math.floor(Math.random() * 8999) + 1000}`,
          expirationDate: '12/28',
          cvv: '123',
          type: 'card' as const,
          note: 'Seeded test card',
        }
      : {
          serviceName: `Dev Secret ${i + 1}`,
          username: `dev_user_${i + 1}`,
          password: `pass_${Math.random().toString(36).substring(7)}`,
          url: `https://dev-test-${i + 1}.io`,
          type: 'password' as const,
          note: 'Seeded test password',
        };

    // Encrypt the payload using the real MEK
    const encrypted = await encryptData(data, mek);

    // items must match the database schema (id, encryptedData, iv)
    return addVaultItem({
      id,
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
    });
  });

  await Promise.all(promises);
  logger.info(`[DevUtils] Successfully seeded ${count} authentic items`);
}

/**
 * Remove all provided vault items by calling the supplied deletion callback for each item.
 *
 * @param vaultItems - Array of vault items to delete; each item must contain an `id` property
 * @param deleteVaultItem - Function invoked with an item's `id` to delete that item
 */
export async function clearVaultItems(
  vaultItems: { id: string }[],
  deleteVaultItem: (id: string) => Promise<void>
) {
  logger.info(`[DevUtils] Clearing ${vaultItems.length} items`);

  const promises = vaultItems.map((item) => deleteVaultItem(item.id));
  await Promise.all(promises);

  logger.info('[DevUtils] Vault cleared successfully');
}
