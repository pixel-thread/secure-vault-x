import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SECRET_TEMPLATES } from '@securevault/constants';
import { SecretTemplate } from '@securevault/types';
import { Container } from '@securevault/ui-native';
import Header from '@src/components/common/Header';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import { StackHeader } from '@src/components/common/StackHeader';
import { AddSecretForm } from '@src/components/screens/secret/AddSecretForm';
import { AddFileForm } from '@src/components/screens/secret/AddFileForm';
import { getIcon } from '@src/utils/helper/getIcon';
import { useThemeStore } from '@src/store/theme';

/**
 * Screen for adding a new secret based on a selected template.
 * Handles template selection from route params and renders the corresponding form.
 */
export default function AddSecret() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();
  const { type } = useLocalSearchParams<{ type: SecretTemplate['type'] }>();

  // --- DERIVED DATA ---
  
  // Select the template based on route param, fallback to first available
  const selectedTemplate = useMemo(() => 
    SECRET_TEMPLATES.find((t) => t.type === type) || SECRET_TEMPLATES[0],
    [type]
  );

  // --- CALLBACKS ---

  const onHandleSuccess = () => router.back();

  // --- RENDER ---

  return (
    <Container>
      {/* Navigation & Page Headers */}
      <StackHeader title="Add Secret" />
      <Header
        title={selectedTemplate.label}
        subtitle={`Securely storing your ${selectedTemplate.type.toLowerCase()} credentials`}
      />

      <ScreenContainer>
        <View className="flex-1 px-6 py-8">
          {/* Template Info Banner */}
          <View className="mb-8 flex-row items-center">
            <View className="mr-4 h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500">
              <Ionicons
                name={getIcon(selectedTemplate.type)}
                size={32}
                color={!isDarkMode ? '#fff' : '#022c22'}
              />
            </View>

            <View>
              <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
                {selectedTemplate.label}
              </Text>
              <Text className="text-zinc-500 dark:text-zinc-400">
                Securely storing your {selectedTemplate.label.toLowerCase()}
              </Text>
            </View>
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
        </View>
      </ScreenContainer>
    </Container>
  );
}

