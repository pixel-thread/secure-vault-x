import { Ionicons } from '@expo/vector-icons';
import { Container } from '@securevault/ui-native';
import { logger } from '@securevault/utils-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { toast } from 'sonner-native';
import Header from '@src/components/common/Header';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import { StackHeader } from '@src/components/common/StackHeader';
import { useVaultContext } from '@hooks/vault/useVaultContext';
import { FileDetailView } from '@src/components/screens/secret/FileDetailView';
import { truncateText } from '@securevault/utils';

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
  const { vaultItems, deleteVaultItem, isLoading } = useVaultContext();

  // --- CORE LOGIC ---

  const selectedSecret = useMemo(() => vaultItems.find((item) => item.id === id), [vaultItems, id]);

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
              await deleteVaultItem(selectedSecret.id);
              logger.info('Secret deleted successfully');
              router.back();
            } catch (error) {
              logger.error('[ViewSecretPage] Delete failed', { error });
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = (value: string) => {
    Clipboard.setStringAsync(value);
    toast.success('Copied it!');
  };

  const openUrl = (url: string) => {
    toast.success('Opening...');
    Linking.openURL(url);
  };

  // --- RENDER HELPERS ---

  if (!selectedSecret) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#09090b]">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  const title =
    (selectedSecret as any).title || (selectedSecret as any).serviceName || 'Secret Details';

  return (
    <Container>
      <StackHeader title={truncateText({ text: title, maxLength: 20 })} />

      <Header
        title={truncateText({ text: title, maxLength: 30 })}
        subtitle="Safe and sound in your vault"
        isSyncing={isLoading.isSyncing}
      />

      <ScreenContainer>
        <ScrollView contentContainerClassName="px-6 py-8" showsVerticalScrollIndicator={false}>
          {/* Render Dynamic Fields */}
          {selectedSecret.type === 'file' ? (
            <FileDetailView item={selectedSecret as any} />
          ) : (
            (selectedSecret as any).fields?.map((field: any) => (
              <View key={field.id} className="mb-6">
                <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {field.label}
                </Text>

                <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <Text
                    className="flex-1 text-base text-zinc-900 dark:text-white"
                    numberOfLines={field.type === 'multiline' ? undefined : 1}>
                    {field.masked ? '••••••••••••' : field.value}
                  </Text>

                  <View className="flex-row gap-2">
                    {(field.copyable || field.masked) && (
                      <TouchableOpacity
                        onPress={() => copyToClipboard(field.value)}
                        className="p-1">
                        <Ionicons name="copy-outline" size={20} color="#10b981" />
                      </TouchableOpacity>
                    )}
                    {field.type === 'url' && (
                      <TouchableOpacity onPress={() => openUrl(field.value)} className="p-1">
                        <Ionicons name="open-outline" size={20} color="#10b981" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Optional Note Section */}
          {selectedSecret.note && (
            <View className="mb-6">
              <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Extra Deets
              </Text>
              <View className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <Text className="text-base leading-6 text-zinc-900 dark:text-white">
                  {selectedSecret.note}
                </Text>
              </View>
            </View>
          )}

          {/* Action Row */}
          <View className="mt-10 gap-4">
            <TouchableOpacity
              onPress={handleEdit}
              className="w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98]">
              <Text className="ml-2 text-lg font-bold text-white dark:text-[#022c22]">
                Change it up
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={isDeleting}
              onPress={handleDelete}
              className="w-full flex-row items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5 py-4 active:scale-[0.98]">
              {isDeleting ? (
                <ActivityIndicator color="#ef4444" size="small" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text className="ml-2 font-semibold text-red-500">Trash it</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}
