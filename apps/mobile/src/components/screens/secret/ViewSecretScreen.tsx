import { Ionicons } from '@expo/vector-icons';
import { Container } from '@securevault/ui-native';
import { logger } from '@securevault/utils-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { toast } from 'sonner-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import { StackHeader } from '@src/components/common/StackHeader';
import { useVaultContext } from '@hooks/vault/useVaultContext';
import { FileDetailView } from '@src/components/screens/secret/FileDetailView';
import { truncateText } from '@securevault/utils';
import { VaultItemIcon } from '../vault/VaultIcon';
import { UrgencyBadge } from './UrgencyBadge';
import { useNotification } from '@hooks/useNotification';
import { encryptData } from '@securevault/crypto';
import { DeviceStoreManager } from '@store/device';

/**
 * ============================================================================
 * VIEW SECRET SCREEN
 * ============================================================================
 * Primary viewer for all vault items.
 * Uses a dynamic layout to render fields based on the secret type.
 * For file types, it delegates to the specialized FileDetailView.
 */
export default function ViewSecretScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { vaultItems, deleteVaultItem, updateVaultItem, isLoading, sync } = useVaultContext();
  const { scheduleForItem } = useNotification();

  // --- CORE LOGIC ---

  const selectedSecret = useMemo(() => vaultItems.find((item) => item.id === id), [vaultItems, id]);
  const [visibleFieldIds, setVisibleFieldIds] = useState<string[]>([]);

  const isDeleting = isLoading.isDeleting;

  // --- HANDLERS ---

  const handleEdit = () => router.push(`/secret/${id}/update-secret`);

  const handleDelete = () => {
    if (!selectedSecret) return;

    Alert.alert(
      'Dump this?',
      'Are you sure you want to delete this secret? This action cannot be undone.',
      [
        { text: 'Never mind', style: 'cancel' },
        {
          text: 'Trash it',
          style: 'destructive',
          onPress: async () => {
            try {
              router.replace('/(drawer)/(tabs)');
              await deleteVaultItem(selectedSecret.id);
              logger.info('Secret deleted successfully');
            } catch (error) {
              logger.error('[ViewSecretPage] Delete failed', { error });
            }
          },
        },
      ],
    );
  };

  const toggleVisibility = (fieldId: string) => {
    setVisibleFieldIds((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId],
    );
  };

  const copyToClipboard = (value: string) => {
    Clipboard.setStringAsync(value);
    toast.success('Say Less');
  };

  const openUrl = (url: string) => {
    toast.success('Vibe check... opening URL');
    Linking.openURL(url);
  };

  // --- RENDER HELPERS ---

  if (!selectedSecret) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const title = selectedSecret.title || 'Secret Details';

  // Extract primary detail (like username or email) for the subtitle
  const primaryDetail =
    selectedSecret.fields?.find(
      (f) => f.label.toLowerCase().includes('user') || f.label.toLowerCase().includes('email'),
    )?.value || selectedSecret.type;

  return (
    <Container>
      <StackHeader title={truncateText({ text: title, maxLength: 28 })} />
      <ScreenContainer>
        <ScrollView
          contentContainerClassName="px-6 py-4 pb-12"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading.isSyncing}
              onRefresh={sync}
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
        >
          {/* 1. HERO SECTION */}
          <View className="mb-8 items-center justify-center pt-6">
            <View className="mb-6 flex-1 scale-150 flex-row items-center justify-center">
              <VaultItemIcon item={selectedSecret} />
            </View>
            <View className="flex-col items-center gap-2">
              <Text className="text-3xl font-extrabold capitalize text-zinc-900 dark:text-white">
                {truncateText({ text: title, maxLength: 28 })}
              </Text>
              <UrgencyBadge
                expiresAt={selectedSecret.meta?.expiresAt}
                nextRotationAt={
                  selectedSecret.meta?.autoRotateDays && selectedSecret.meta?.updatedAt
                    ? Number(selectedSecret.meta.updatedAt) +
                      selectedSecret.meta.autoRotateDays * 86400000
                    : undefined
                }
              />
              <View className="flex-row items-center gap-1.5">
                {selectedSecret.meta?.environment && (
                  <View className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5">
                    <Text className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-500">
                      {selectedSecret.meta.environment}
                    </Text>
                  </View>
                )}
                <View className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 dark:border-zinc-700 dark:bg-zinc-800">
                  <Text className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400">
                    {selectedSecret.type}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="mt-1 text-base font-medium text-zinc-500 dark:text-zinc-400">
              {primaryDetail}
            </Text>
          </View>

          {selectedSecret.type === 'login' || selectedSecret.type === 'api_key' ? (
            <View className="mb-6 overflow-hidden rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                  <Text className="ml-2 font-bold text-emerald-700 dark:text-emerald-400">
                    Security Rotation
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    const now = Date.now();
                    const updatedSecret = {
                      ...selectedSecret,
                      meta: { ...selectedSecret.meta, updatedAt: now },
                    };

                    const mek = await DeviceStoreManager.getMek();
                    if (!mek) {
                      toast.error('Major L. Key missing.');
                      return;
                    }

                    const { encryptedData, iv } = await encryptData(updatedSecret, mek);
                    await updateVaultItem({
                      id: updatedSecret.id,
                      encryptedData,
                      iv,
                      version: Date.now(),
                    });

                    await scheduleForItem(updatedSecret);
                    toast.success('Manifested! Rotation reset.');
                  }}
                  className="rounded-full bg-emerald-500/20 px-3 py-1"
                >
                  <Text className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500">
                    ROTATE NOW
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between border-t border-emerald-500/10 pt-3">
                <Text className="text-sm font-medium text-emerald-700 dark:text-emerald-400/80">
                  Next Scheduled
                </Text>
                <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">
                  {selectedSecret.meta?.autoRotateDays
                    ? new Date(
                        Number(selectedSecret.meta.updatedAt) +
                          selectedSecret.meta.autoRotateDays * 86400000,
                      ).toLocaleDateString()
                    : 'Not set'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 3. STRUCTURAL CARDS FOR FIELDS */}
          {selectedSecret.type === 'file' ? (
            <FileDetailView item={selectedSecret} />
          ) : (
            <View className="mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40">
              {selectedSecret.fields?.map((field, index) => {
                const isLast = index === (selectedSecret.fields?.length || 0) - 1;
                return (
                  <View
                    key={field.id}
                    className={`p-5 ${!isLast ? 'border-b border-zinc-200 dark:border-zinc-800' : ''}`}
                  >
                    <Text className="mb-1 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                      {field.label}
                    </Text>

                    <View className="flex-row items-center justify-between">
                      <Text
                        className="flex-1 text-lg font-medium text-zinc-900 dark:text-white"
                        numberOfLines={field.type === 'multiline' ? undefined : 1}
                      >
                        {field.masked && !visibleFieldIds.includes(field.id)
                          ? '••••••••••••••••'
                          : field.value}
                      </Text>

                      <View className="ml-4 flex-row gap-3">
                        {field.masked && (
                          <TouchableOpacity
                            onPress={() => toggleVisibility(field.id)}
                            className="rounded-full bg-zinc-200/50 p-2 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700"
                          >
                            <Ionicons
                              name={
                                visibleFieldIds.includes(field.id)
                                  ? 'eye-off-outline'
                                  : 'eye-outline'
                              }
                              size={22}
                              color="#10b981"
                            />
                          </TouchableOpacity>
                        )}
                        {(field.copyable || field.masked) && (
                          <TouchableOpacity
                            onPress={() => copyToClipboard(field.value)}
                            className="rounded-full bg-zinc-200/50 p-2 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700"
                          >
                            <Ionicons name="copy-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        )}
                        {field.type === 'url' && (
                          <TouchableOpacity
                            onPress={() => openUrl(field.value)}
                            className="rounded-full bg-zinc-200/50 p-2 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700"
                          >
                            <Ionicons name="open-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Optional Note Section */}
          {selectedSecret.note && (
            <View className="mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
              <Text className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Extra Deets
              </Text>
              <Text className="text-base leading-6 text-zinc-900 dark:text-white">
                {selectedSecret.note}
              </Text>
            </View>
          )}

          {/* 4. METADATA SECTION */}
          <View className="mb-6 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <View className="mb-4 flex-row items-center">
              <Ionicons name="information-circle-outline" size={18} color="#10b981" />
              <Text className="ml-2 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                Metadata
              </Text>
            </View>

            {selectedSecret.meta?.tags && selectedSecret.meta.tags.length > 0 && (
              <View className="mb-4 flex-row flex-wrap gap-2">
                {selectedSecret.meta.tags.map((tag: string) => (
                  <View
                    key={tag}
                    className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1"
                  >
                    <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {selectedSecret.meta?.environment && (
              <View className="flex-row items-center justify-between border-t border-zinc-200/50 pt-3 dark:border-zinc-800/50">
                <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Environment
                </Text>
                <View className="flex-row items-center">
                  <View
                    className={`mr-2 h-2 w-2 rounded-full ${selectedSecret.meta.environment === 'prod' ? 'bg-red-500' : selectedSecret.meta.environment === 'staging' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                  <Text className="text-sm font-bold uppercase text-zinc-900 dark:text-white">
                    {selectedSecret.meta.environment}
                  </Text>
                </View>
              </View>
            )}

            {selectedSecret.meta?.autoRotateDays && (
              <View className="mt-3 flex-row items-center justify-between border-t border-zinc-200/50 pt-3 dark:border-zinc-800/50">
                <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Rotation Cycle
                </Text>
                <Text className="text-sm font-bold text-zinc-900 dark:text-white">
                  {selectedSecret.meta.autoRotateDays} days
                </Text>
              </View>
            )}

            {selectedSecret.meta?.expiresAt && (
              <View className="mt-2 flex-row items-center justify-between border-t border-zinc-200/10 pt-2 dark:border-zinc-800/10">
                <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Expires
                </Text>
                <Text className="text-sm font-bold text-zinc-900 dark:text-white">
                  {new Date(selectedSecret.meta.expiresAt).toLocaleDateString()}
                </Text>
              </View>
            )}

            <View className="mt-3 flex-row items-center justify-between border-t border-zinc-200/50 pt-3 dark:border-zinc-800/50">
              <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Created</Text>
              <Text className="text-sm font-bold text-zinc-900 dark:text-white">
                {new Date(selectedSecret.meta?.createdAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>

            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Modified</Text>
              <Text className="text-sm font-bold text-zinc-900 dark:text-white">
                {new Date(selectedSecret.meta?.updatedAt || Date.now()).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* 5. CLEAN ACTIONS */}
          <View className="mt-4 gap-4">
            <TouchableOpacity
              onPress={handleEdit}
              className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
            >
              <Text className="ml-2 text-lg font-bold text-[#022c22]">Change it up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isDeleting}
              onPress={handleDelete}
              className="w-full flex-row items-center justify-center rounded-2xl border border-red-500/30 bg-transparent py-4 active:scale-[0.98] active:bg-red-500/10"
            >
              {isDeleting ? (
                <ActivityIndicator color="#ef4444" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  <Text className="ml-2 font-bold text-red-500">Trash it</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}
