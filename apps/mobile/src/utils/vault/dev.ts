import { DeviceStoreManager } from '@store/device';
import { encryptData } from '@securevault/crypto';
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { logger } from '@securevault/utils-native';
import { SECRET_TEMPLATES } from '@securevault/constants';
import { VaultSecretT } from '@src/types/vault';

/**
 * Helper to generate realistic mock values based on field label and type
 */
function generateMockValue(label: string, type: string, index: number): string {
  const lowerLabel = label.toLowerCase();

  if (
    lowerLabel.includes('password') ||
    lowerLabel.includes('key') ||
    lowerLabel.includes('phrase')
  ) {
    return `pass_${Math.random().toString(36).substring(7)}_${index}`;
  }
  if (lowerLabel.includes('user')) {
    return `user_${index + 1}`;
  }
  if (lowerLabel.includes('url') || lowerLabel.includes('website')) {
    return `https://github.com`;
  }
  if (lowerLabel.includes('email')) {
    return `dev-${index + 1}@example.com`;
  }
  if (lowerLabel.includes('card number')) {
    return `4111${Math.floor(Math.random() * 8999) + 1000}${Math.floor(Math.random() * 8999) + 1000}${Math.floor(Math.random() * 8999) + 1000}`;
  }
  if (lowerLabel.includes('cvv')) {
    return Math.floor(Math.random() * 899 + 100).toString();
  }
  if (lowerLabel.includes('address')) {
    return `0x${Math.random().toString(16).substring(2, 42)}`;
  }

  return `Mock ${label} ${index + 1}`;
}

/**
 * Seed the vault with mock items for development and testing.
 *
 * Cycles through all available SECRET_TEMPLATES to ensure every type of secret is represented.
 *
 * @param addVaultItem - Called for each persisted item with an object containing `id`, `encryptedData`, and `iv`
 * @param count - Number of items to generate (default 100)
 */
export async function seedVaultItems(
  addVaultItem: (item: {
    id: string;
    encryptedData: string;
    iv: string;
    version: number;
  }) => Promise<void>,
  count: number = 10,
) {
  const mek = await DeviceStoreManager.getMek();

  if (!mek) {
    throw new Error(
      'MEK not found in device store. Please ensure you are logged in and have set up your vault.',
    );
  }

  logger.info(`[DevUtils] Seeding ${count} items across ${SECRET_TEMPLATES.length} types`);

  const promises = Array.from({ length: count }).map(async (_, i) => {
    const template = SECRET_TEMPLATES[i % SECRET_TEMPLATES.length];
    const id = Crypto.randomUUID();

    // Map template fields to mock data
    const fields = template.fields.map((f) => ({
      id: Crypto.randomUUID(),
      label: f.label,
      value: generateMockValue(f.label, f.type, i),
      type: f.type,
      masked: f.masked,
      copyable: f.copyable,
    }));

    const secretPayload = {
      id,
      title: `Seeded ${template.label} ${Math.floor(i / SECRET_TEMPLATES.length) + 1}`,
      type: template.type,
      fields,
      note: `Automatically generated test entry for ${template.label}.`,
      meta: {
        createdAt: Date.now() - Math.floor(Math.random() * 10000000), // Random past dates
        updatedAt: Date.now(),
      },
    };

    // Encrypt the payload using the real MEK
    const { encryptedData, iv } = await encryptData(secretPayload, mek);

    return addVaultItem({
      id,
      encryptedData,
      iv,
      version: Date.now(),
    });
  });

  await Promise.all(promises);
  logger.info(`[DevUtils] Successfully seeded ${count} diverse items`);
}

/**
 * Remove all provided vault items by calling the supplied deletion callback for each item.
 *
 * @param vaultItems - Array of vault items to delete; each item must contain an `id` property
 * @param deleteVaultItem - Function invoked with an item's `id` to delete that item
 */
export async function clearVaultItems(
  vaultItems: { id: string }[],
  deleteVaultItem: (id: string) => Promise<void>,
) {
  logger.info(`[DevUtils] Clearing ${vaultItems.length} items`);

  const promises = vaultItems.map((item) => deleteVaultItem(item.id));
  await Promise.all(promises);

  logger.info('[DevUtils] Vault cleared successfully');
}

/**
 * Drops the entire local SQLite database file containing all application data and migrations.
 * WARNING: This is a destructive operation primarily meant for development resets or terminal wipes.
 * The application must be reloaded (Updates.reloadAsync()) after this operation to recreate schemas.
 *
 * @param dbName - The name of the database to drop, defaults to 'app.db'
 */
export async function dropDatabase(dbName: string = 'app.db') {
  logger.info(`[DevUtils] Warning: Dropping entire SQLite database (${dbName})...`);
  try {
    // Attempt graceful close if the db connection is accessible, otherwise delete directly
    await SQLite.deleteDatabaseAsync(dbName);
    logger.info(
      `[DevUtils] Database ${dbName} successfully dropped. Trigger an app reload to recreate tables.`,
    );
  } catch (error) {
    logger.error(`[DevUtils] Failed to drop database ${dbName}`, error);
    throw error;
  }
}

/**
 * Schedules test notifications for all types of secrets, staggered by 1 minute.
 */
export async function scheduleTestNotifications(
  vaultItems: VaultSecretT[],
  scheduleTest: (item: VaultSecretT, delayMs: number) => Promise<string | null>,
) {
  logger.info(`[DevUtils] Scheduling test notifications for ${vaultItems.length} items`);

  // Group by type to ensure we hit one of each
  const types = Array.from(new Set(vaultItems.map((i) => i.type)));
  const uniqueItems = types
    .map((t) => vaultItems.find((i) => i.type === t))
    .filter(Boolean) as VaultSecretT[];

  for (let i = 0; i < uniqueItems.length; i++) {
    const item = uniqueItems[i];
    const delayMs = (i + 1) * 60000; // 1 min, 2 min, etc.
    await scheduleTest(item, delayMs);
  }

  logger.info(`[DevUtils] Successfully scheduled ${uniqueItems.length} test notifications`);
}
