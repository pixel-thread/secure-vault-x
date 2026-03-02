import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../Header';
import { useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import { encryptData, decryptData } from '@securevault/crypto';
import { useColorScheme } from 'nativewind';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AddPasswordForm } from './AddPasswordForm';
import { AddBankCardForm } from './AddBankCardForm';

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

const API_VAULT = 'http://localhost:3000/vault';

const VaultItemIcon = ({ item }: { item: VaultSecret }) => {
  const [imgError, setImgError] = useState(false);

  const renderIcon = () => {
    if (item.type === 'password' && item.website && !imgError) {
      let domain = item.website;
      try {
        domain = new URL(item.website).hostname;
      } catch (e) {
        // Fallback if not a strict URL format
      }
      return (
        <Image
          source={{ uri: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` }}
          style={{ width: 24, height: 24, borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <Ionicons
        name={item.type === 'password' ? 'key' : 'card-outline'}
        size={24}
        color="#10b981"
      />
    );
  };

  return (
    <View className="mr-5 h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
      {renderIcon()}
    </View>
  );
};

const mockVault: VaultSecret[] = [
  {
    id: '1',
    type: 'password',
    serviceName: 'Google',
    website: 'https://google.com',
    username: 'user@gmail.com',
    secretInfo: 'password123',
  },
  {
    id: '2',
    type: 'card',
    serviceName: 'Primary Chase Card',
    cardholderName: 'John Doe',
    cardNumber: '4111222233334444',
    expirationDate: '12/26',
    cvv: '123',
  },
  {
    id: '3',
    type: 'password',
    serviceName: 'Bank Portal',
    website: 'https://bank.com',
    username: 'user123',
    secretInfo: 'bank_auth',
  },
];

export default function VaultScreen() {
  const queryClient = useQueryClient();
  const { jwtToken, mek } = useAuthStore();
  const [version, setVersion] = useState(0);

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<VaultSecret | null>(null);
  const [selectedType, setSelectedType] = useState<SecretType>('password');

  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const {
    data: vault = [],
    isLoading,
    isFetching,
    refetch: syncVault,
  } = useQuery({
    queryKey: ['vault'],
    queryFn: async () => {
      if (!jwtToken || !mek) return mockVault;

      const response = await fetch(API_VAULT, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.encryptedData) {
          const envelope = JSON.parse(data.encryptedData);
          if (envelope.e && envelope.iv) {
            const decryptedString = await decryptData(envelope.e, envelope.iv, mek);
            setVersion(data.version);
            const parsed = JSON.parse(decryptedString) as VaultSecret[];
            return parsed.length > 0 ? parsed : mockVault;
          }
        } else {
          return mockVault;
        }
      }
      return mockVault; // Fallback to mock on error or null
    },
    enabled: !!jwtToken && !!mek,
    initialData: mockVault,
  });

  const loading = isLoading || isFetching;

  const addSecretMutation = useMutation({
    mutationFn: async (newVaultState: VaultSecret[]) => {
      if (!jwtToken || !mek) return newVaultState;

      const plaintext = JSON.stringify(newVaultState);
      const envelope = await encryptData(plaintext, mek);

      const payload = {
        encryptedData: JSON.stringify({ e: envelope.encryptedData, iv: envelope.iv }),
        version: version + 1,
      };

      const res = await fetch(API_VAULT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwtToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to push vault up');
      }

      const data = await res.json();
      return { version: data.version, vaultState: newVaultState };
    },
    onSuccess: (data) => {
      if (!data || !('version' in data)) return;
      setVersion(data.version);
      queryClient.setQueryData(['vault'], data.vaultState);
    },
    onError: (err) => {
      console.warn('Save Conflict', err.message);
    },
  });

  const handleAddNewItem = async (data: any) => {
    let newItem: VaultSecret;

    if (selectedType === 'password') {
      newItem = {
        id: Date.now().toString(),
        type: 'password',
        serviceName: data.serviceName,
        website: data.url,
        username: data.username,
        secretInfo: data.password,
        note: data.note,
      };
    } else {
      newItem = {
        id: Date.now().toString(),
        type: 'card',
        serviceName: data.serviceName,
        cardholderName: data.cardName,
        cardNumber: data.cardNumber,
        expirationDate: data.exp,
        cvv: data.cvv,
        note: data.note,
      };
    }

    const newVaultState = [newItem, ...vault];

    // Optimistic UI Update
    queryClient.setQueryData(['vault'], newVaultState);
    setModalVisible(false);

    // Call mutation
    addSecretMutation.mutate(newVaultState);
  };

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
        data={vault}
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
          <TouchableOpacity
            className="mb-4 flex-row items-center rounded-3xl border border-zinc-200 bg-zinc-50 p-5 active:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/40 dark:active:bg-zinc-800/60"
            onPress={() => {
              setSelectedSecret(item);
              setDetailModalVisible(true);
            }}
          >
            <VaultItemIcon item={item} />
            <View className="flex-1">
              {item.type === 'password' ? (
                <>
                  <Text className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
                    {item.serviceName}
                  </Text>
                  <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {item.username}
                  </Text>
                </>
              ) : (
                <>
                  <Text className="mb-1 text-xl font-bold text-zinc-900 dark:text-white">
                    {item.serviceName}
                  </Text>
                  <Text className="font-mono text-sm font-medium tracking-widest text-zinc-500 dark:text-zinc-400">
                    •••• {item.cardNumber.slice(-4)}
                  </Text>
                </>
              )}
            </View>
            <TouchableOpacity
              className="h-10 w-10 items-center justify-center rounded-full bg-zinc-200 active:bg-zinc-300 dark:bg-zinc-800/80 dark:active:bg-zinc-700"
              onPress={() => {
                const textToCopy = item.type === 'password' ? item.secretInfo : item.cardNumber;
                Clipboard.setStringAsync(textToCopy);
                Alert.alert('Copied', 'Copied to clipboard!');
              }}
            >
              <Ionicons name="copy-outline" size={20} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        className="absolute bottom-8 right-8 h-16 w-16 items-center justify-center rounded-full bg-emerald-500 shadow-2xl shadow-emerald-500/40 active:scale-95"
        onPress={() => {
          setSelectedType('password');
          setModalVisible(true);
        }}>
        <Ionicons name="add" size={32} color="#022c22" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="m-4 max-h-[85%] rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#09090b]">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-zinc-900 dark:text-white">Add Secret</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-800/80">
                <Ionicons name="close" size={24} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
              </TouchableOpacity>
            </View>

            {/* Type Selector Toggle */}
            <View className="mb-6 flex-row rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900/50">
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 8,
                  paddingVertical: 8,
                  backgroundColor:
                    selectedType === 'password' ? (isDarkMode ? '#27272a' : '#fff') : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: selectedType === 'password' ? 0.1 : 0,
                  shadowRadius: 1,
                  elevation: selectedType === 'password' ? 2 : 0,
                }}
                onPress={() => setSelectedType('password')}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color:
                      selectedType === 'password'
                        ? isDarkMode
                          ? '#ffffff'
                          : '#09090b'
                        : '#71717a',
                  }}>
                  Password
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderRadius: 8,
                  paddingVertical: 8,
                  backgroundColor:
                    selectedType === 'card' ? (isDarkMode ? '#27272a' : '#fff') : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: selectedType === 'card' ? 0.1 : 0,
                  shadowRadius: 1,
                  elevation: selectedType === 'card' ? 2 : 0,
                }}
                onPress={() => setSelectedType('card')}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color:
                      selectedType === 'card' ? (isDarkMode ? '#ffffff' : '#09090b') : '#71717a',
                  }}>
                  Bank Card
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              className="mb-6"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 20 }}>
              {selectedType === 'password' ? (
                <AddPasswordForm onSubmit={handleAddNewItem} />
              ) : (
                <AddBankCardForm onSubmit={handleAddNewItem} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="m-4 max-h-[85%] rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#09090b]">
            {selectedSecret && (
              <>
                <View className="mb-6 flex-row items-center justify-between">
                  <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
                    {selectedSecret.serviceName}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setDetailModalVisible(false);
                      setSelectedSecret(null);
                    }}
                    className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-800/80">
                    <Ionicons name="close" size={24} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
                  {selectedSecret.type === 'password' ? (
                    <>
                      {selectedSecret.website ? (
                        <View className="mb-4">
                          <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Website URL
                          </Text>
                          <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <Text className="flex-1 text-zinc-900 dark:text-white">
                              {selectedSecret.website}
                            </Text>
                            <TouchableOpacity
                              className="p-1"
                              onPress={() => Linking.openURL(selectedSecret.website)}>
                              <Ionicons name="open-outline" size={22} color="#10b981" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}

                      <View className="mb-4">
                        <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Username
                        </Text>
                        <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                          <Text className="flex-1 text-zinc-900 dark:text-white">
                            {selectedSecret.username}
                          </Text>
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => {
                              Clipboard.setStringAsync(selectedSecret.username);
                              Alert.alert('Copied', 'Username copied!');
                            }}>
                            <Ionicons name="copy-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="mb-4">
                        <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Password
                        </Text>
                        <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                          <Text className="flex-1 text-xl tracking-[0.2em] text-zinc-900 dark:text-white">
                            ••••••••••••
                          </Text>
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => {
                              Clipboard.setStringAsync(selectedSecret.secretInfo);
                              Alert.alert('Copied', 'Password copied!');
                            }}>
                            <Ionicons name="copy-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </>
                  ) : (
                    <>
                      <View className="mb-4">
                        <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Cardholder Name
                        </Text>
                        <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                          <Text className="flex-1 text-zinc-900 dark:text-white">
                            {selectedSecret.cardholderName}
                          </Text>
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => {
                              Clipboard.setStringAsync(selectedSecret.cardholderName);
                              Alert.alert('Copied', 'Name copied!');
                            }}>
                            <Ionicons name="copy-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="mb-4">
                        <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Card Number
                        </Text>
                        <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                          <Text className="flex-1 font-mono text-zinc-900 dark:text-white">
                            {selectedSecret.cardNumber}
                          </Text>
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => {
                              Clipboard.setStringAsync(selectedSecret.cardNumber);
                              Alert.alert('Copied', 'Card number copied!');
                            }}>
                            <Ionicons name="copy-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="mb-4 flex-row gap-4">
                        <View className="flex-1">
                          <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Expires
                          </Text>
                          <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <Text className="flex-1 text-zinc-900 dark:text-white">
                              {selectedSecret.expirationDate}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-1">
                          <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            CVV
                          </Text>
                          <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                            <Text className="flex-1 text-zinc-900 dark:text-white">***</Text>
                            <TouchableOpacity
                              className="p-1"
                              onPress={() => {
                                Clipboard.setStringAsync(selectedSecret.cvv);
                                Alert.alert('Copied', 'CVV copied!');
                              }}>
                              <Ionicons name="copy-outline" size={22} color="#10b981" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </>
                  )}

                  {selectedSecret.note ? (
                    <View className="mb-4">
                      <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Note
                      </Text>
                      <View className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <Text className="text-zinc-900 dark:text-white">{selectedSecret.note}</Text>
                      </View>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    className="mt-2 mb-4 w-full flex-row items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 py-4 shadow-xl active:scale-[0.98] dark:border-red-500/20 dark:bg-red-500/10"
                    onPress={() => {
                      Alert.alert(
                        'Delete Secret',
                        'Are you sure you want to delete this item? This action cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              const newVaultState = vault.filter((s) => s.id !== selectedSecret.id);
                              queryClient.setQueryData(['vault'], newVaultState);
                              addSecretMutation.mutate(newVaultState);
                              setDetailModalVisible(false);
                              setSelectedSecret(null);
                            },
                          },
                        ]
                      );
                    }}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    <Text className="ml-2 text-lg font-bold text-red-500">
                      Delete {selectedSecret.type === 'password' ? 'Password' : 'Card'}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
