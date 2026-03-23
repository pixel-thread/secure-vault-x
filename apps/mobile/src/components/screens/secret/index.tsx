import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SECRET_TEMPLATES } from '@securevault/constants';
import { useThemeStore } from '@src/store/theme';
import { getIcon } from '@src/utils/helper/getIcon';
import { StackHeader } from '@src/components/common/StackHeader';
import { Container } from '@securevault/ui-native';

export default function Secrets() {
  const router = useRouter();
  const { isDarkMode } = useThemeStore();

  return (
    <Container>
      <StackHeader title="Secure Vault X" />
      <ScrollView contentContainerClassName="px-6 py-8">
        <View>
          <Text className="mb-6 text-xl font-bold text-zinc-900 dark:text-white">
            What would you like to add?
          </Text>
          <View className="gap-3">
            {SECRET_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.type}
                onPress={() => router.push(`/secret/add-secret?type=${template.type}`)}
                className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-5 active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:active:bg-zinc-800"
              >
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Ionicons name={getIcon(template.type)} size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {template.label}
                  </Text>
                  <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                    Create a new {template.label.toLowerCase()} entry
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isDarkMode ? '#3f3f46' : '#a1a1aa'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
