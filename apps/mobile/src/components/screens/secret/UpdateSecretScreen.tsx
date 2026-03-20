import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { useVaultContext } from '@hooks/vault/useVaultContext';
import { AddSecretForm } from '@src/components/screens/secret/AddSecretForm';
import { SECRET_TEMPLATES } from '@securevault/constants';
import { logger } from '@securevault/utils-native';
import { StackHeader } from '@src/components/common/StackHeader';
import Header from '@src/components/common/Header';
import { Container } from '@securevault/ui-native';

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
      <View className="flex-1 items-center justify-center bg-white dark:bg-[#09090b]">
        <Stack.Screen options={{ title: 'Update Secret' }} />
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  // Find the exact matching template or fallback
  const template =
    SECRET_TEMPLATES.find((t) => t.type === selectedSecret.type) || SECRET_TEMPLATES[0];

  const title =
    (selectedSecret as any).title || (selectedSecret as any).serviceName || 'Secret Details';

  return (
    <Container>
      {/* Navigation & Page Headers */}
      <StackHeader title={title} />

      <Header title={title} subtitle="Safe and sound in your vault" />

      <ScrollView contentContainerClassName="p-6" showsVerticalScrollIndicator={false}>
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
