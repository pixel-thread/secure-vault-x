import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../Header';
import { useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import { useQuery } from '@tanstack/react-query';
import { http } from '@securevault/utils-native';
import { VAULT_ENDPOINT } from '@securevault/constants';
import { VaultItem } from './VaultItem';
import { VaultItemDialog } from './VaultItemDialog';
import { AddSecretDialog } from './AddSecretDialog';

export type SecretType = 'password' | 'card';

interface BaseSecret {
  id: string;
  type: SecretType;
  serviceName: string;
  note?: string;
}

interface PasswordSecret extends BaseSecret {
  type: 'password';
  website: string;
  username: string;
  secretInfo: string;
}

interface CardSecret extends BaseSecret {
  type: 'card';
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

export type VaultSecret = PasswordSecret | CardSecret;

export default function VaultScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<VaultSecret | null>(null);

  const {
    data: vaults = [],
    isLoading,
    isFetching,
    refetch: syncVault,
  } = useQuery({
    queryKey: ['vault'],
    queryFn: () => http.get<any>(VAULT_ENDPOINT.GET_VAULT),
    enabled: isAuthenticated,
    select: (data) => data?.data,
  });
  const loading = isLoading || isFetching;

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
        ListEmptyComponent={
          !loading ? (
            <View className="mt-20 items-center justify-center">
              <View className="mb-6 rounded-full border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800/50 dark:bg-zinc-900/60">
                <Ionicons name="file-tray-outline" size={64} color="#71717a" />
              </View>
              <Text className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                Your Vault is Empty
              </Text>
              <Text className="mt-2 text-center text-zinc-500">
                Tap the button below to add your first encrypted secret.
              </Text>
            </View>
          ) : null
        }
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
      <VaultItemDialog
        onValueChange={(value) => {
          setDetailModalVisible(value);
          setSelectedSecret(null);
        }}
        open={detailModalVisible}
        item={selectedSecret}
      />
    </View>
  );
}
