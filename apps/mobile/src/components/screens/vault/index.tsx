import { View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../common/Header';
import { useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import { useQuery } from '@tanstack/react-query';
import { http, logger } from '@securevault/utils-native';
import { VAULT_ENDPOINT } from '@securevault/constants';
import { VaultItem } from './VaultItem';
import { VaultItemDialog } from './VaultItemDialog';
import { AddSecretDialog } from './AddSecretDialog';
import { VaultEmpty } from './VaultEmpty';
import { MekSetup } from './MekSetup';
import { decryptData } from '@securevault/crypto';
import { DeviceStoreManager } from '../../../store/device';
import { VaultSecretT } from '@/src/types/vault';

/** Shape of each encrypted vault entry returned by the API */
interface EncryptedVaultEntry {
  encryptedData: string;
  iv: string | null;
}

/** Shape of the decrypted payload stored inside each vault entry */
interface DecryptedPasswordPayload {
  serviceName: string;
  url?: string;
  username: string;
  password: string;
  note?: string;
}

const getAndDecryptVault = async (): Promise<VaultSecretT[]> => {
  const response = await http.get<EncryptedVaultEntry[]>(VAULT_ENDPOINT.GET_VAULT);
  const entries: EncryptedVaultEntry[] = response?.data ?? [];

  // Nothing to decrypt
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const mek = await DeviceStoreManager.getMek();

  if (!mek) {
    logger.error('Vault decrypt failed: MEK not found in SecureStore');
    return [];
  }

  const decrypted: VaultSecretT[] = [];

  for (const entry of entries) {
    if (!entry.encryptedData || !entry.iv) continue;
    try {
      const payload = await decryptData<DecryptedPasswordPayload>(
        entry.encryptedData,
        entry.iv,
        mek
      );

      decrypted.push({
        id: entry.iv,
        type: 'password',
        serviceName: payload.serviceName,
        website: payload.url ?? '',
        username: payload.username,
        secretInfo: payload.password,
        note: payload.note,
      });
    } catch (err) {
      logger.error('Failed to decrypt vault entry', {
        iv: entry.iv,
        error: err instanceof Error ? err.message : err,
      });
    }
  }

  return decrypted;
};

export default function VaultScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { isAuthenticated, hasMek } = useAuthStore();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<VaultSecretT | null>(null);

  const {
    data: vaults = [],
    isLoading,
    isFetching,
    refetch: syncVault,
  } = useQuery<VaultSecretT[]>({
    queryKey: ['vault'],
    queryFn: async (): Promise<VaultSecretT[]> => getAndDecryptVault(),
    enabled: isAuthenticated && hasMek,
  });

  const loading = isLoading || isFetching;

  if (!hasMek) {
    return <MekSetup />;
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#09090b]">
      <Header
        title="My Vault"
        subtitle="End-to-End Encrypted"
        rightElement={
          <TouchableOpacity
            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-md active:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/80 dark:active:bg-zinc-800"
            onPress={() => syncVault()}>
            {loading ? (
              <ActivityIndicator color="#10b981" />
            ) : (
              <Ionicons name="sync" size={24} color="#10b981" />
            )}
          </TouchableOpacity>
        }
      />

      <FlatList
        data={vaults}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-6 pb-32"
        className="flex-1"
        ListEmptyComponent={<VaultEmpty />}
        renderItem={({ item }) => (
          <VaultItem
            item={item}
            onSelectItem={(item) => {
              setSelectedSecret(item);
              setDetailModalVisible(true);
            }}
          />
        )}
      />

      <TouchableOpacity
        className="absolute bottom-8 right-8 h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-500/40 active:scale-95"
        onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={32} color="#022c22" />
      </TouchableOpacity>
      <AddSecretDialog open={modalVisible} onValueChange={setModalVisible} />
      {selectedSecret && (
        <VaultItemDialog
          onValueChange={(value) => {
            setDetailModalVisible(value);
            setSelectedSecret(null);
          }}
          open={detailModalVisible}
          item={selectedSecret}
        />
      )}
    </View>
  );
}
