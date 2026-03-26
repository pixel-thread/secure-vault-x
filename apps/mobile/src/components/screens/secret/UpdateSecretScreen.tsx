import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useVaultContext } from '@hooks/vault/useVaultContext';
import { AddSecretForm } from '@src/components/screens/secret/AddSecretForm';
import { SECRET_TEMPLATES } from '@securevault/constants';
import { logger } from '@securevault/utils-native';
import { StackHeader } from '@src/components/common/StackHeader';
import { Container } from '@securevault/ui-native';
import { VaultItemIcon } from '../vault/VaultIcon';

export default function UpdateSecretPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { vaultItems } = useVaultContext();

  const selectedSecret = useMemo(() => {
    return vaultItems.find((item) => item.id === id);
  }, [vaultItems, id]);

  const handleSuccess = () => {
    logger.info('Secret updated successfully, returning to view screen');
    // Once successful, simply go back to the view screen.
    // The VaultProvider/usePasswordMutation underlying logic triggers the toast.
    router.back();
  };

  if (!selectedSecret) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Stack.Screen options={{ title: 'Update Secret' }} />
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Find the exact matching template or fallback
  const template =
    SECRET_TEMPLATES.find((t) => t.type === selectedSecret.type) || SECRET_TEMPLATES[0];

  return (
    <Container>
      <StackHeader title="" />

      <ScrollView contentContainerClassName="px-6 py-4 pb-12" showsVerticalScrollIndicator={false}>
        {/* Robust Hero Section */}
        <View className="mb-8 items-center justify-center pt-6">
          <View className="mb-4 scale-125 transform">
            <VaultItemIcon item={selectedSecret} />
          </View>
          <Text className="text-3xl font-extrabold capitalize text-zinc-900 dark:text-white">
            Update {template.label}
          </Text>
          <Text className="mt-2 text-center text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
            Make changes to your {template.label.toLowerCase()}. All edits are encrypted locally.
          </Text>
        </View>
        <AddSecretForm
          mode="edit"
          template={template}
          initialValues={selectedSecret}
          onSuccess={handleSuccess}
          onCancel={() => router.back()}
        />
      </ScrollView>
    </Container>
  );
}
