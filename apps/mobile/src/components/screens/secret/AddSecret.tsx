import { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SECRET_TEMPLATES } from '@securevault/constants';
import { SecretTemplate } from '@securevault/types';
import { Container } from '@securevault/ui-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import { StackHeader } from '@src/components/common/StackHeader';
import { AddSecretForm } from '@src/components/screens/secret/AddSecretForm';
import { AddFileForm } from '@src/components/screens/secret/AddFileForm';
import { getIcon } from '@src/utils/helper/getIcon';

/**
 * Screen for adding a new secret based on a selected template.
 * Handles template selection from route params and renders the corresponding form.
 */
export default function AddSecret() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: SecretTemplate['type'] }>();

  // --- DERIVED DATA ---

  // Select the template based on route param, fallback to first available
  const selectedTemplate = useMemo(
    () => SECRET_TEMPLATES.find((t) => t.type === type) || SECRET_TEMPLATES[0],
    [type]
  );

  // --- CALLBACKS ---

  const onHandleSuccess = () => router.back();

  // --- RENDER ---

  return (
    <Container>
      {/* Navigation & Page Headers */}
      <StackHeader title="" />

      <ScreenContainer>
        <ScrollView
          contentContainerClassName="px-6 py-4 pb-12"
          showsVerticalScrollIndicator={false}>
          {/* Robust Hero Section */}
          <View className="mb-8 items-center justify-center pt-6">
            <View className="mb-5 h-24 w-24 items-center justify-center rounded-[32px] border border-emerald-500/20 bg-emerald-500/10 shadow-lg shadow-emerald-500/10">
              <Ionicons name={getIcon(selectedTemplate.type)} size={48} color="#10b981" />
            </View>
            <Text className="text-3xl font-extrabold capitalize text-zinc-900 dark:text-white">
              New {selectedTemplate.label}
            </Text>
            <Text className="mt-2 text-center text-base font-medium leading-6 text-zinc-500 dark:text-zinc-400">
              Enter your {selectedTemplate.label.toLowerCase()} details securely. They will be
              encrypted before leaving your device.
            </Text>
          </View>

          {/* Dynamic Secret Type Form */}
          {selectedTemplate.type === 'file' ? (
            <AddFileForm
              template={selectedTemplate}
              onSuccess={onHandleSuccess}
              onCancel={() => router.back()}
            />
          ) : (
            <AddSecretForm
              template={selectedTemplate}
              onSuccess={onHandleSuccess}
              onCancel={() => router.back()}
            />
          )}
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}
