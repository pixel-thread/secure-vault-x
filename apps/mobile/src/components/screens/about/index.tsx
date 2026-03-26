import { View, Text, ScrollView } from 'react-native';
import Header from '@components/common/Header';
import { Container } from '@securevault/ui-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';

/**
 * About screen with project information and credits.
 */
export default function AboutScreen() {
  return (
    <Container>
      <ScreenContainer>
        <Header title="The Lore" subtitle="The secret sauce" />
        <ScrollView className="flex-1 p-6">
          <View className="mb-8 rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <Text className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">
              What is this?
            </Text>
            <Text className="text-lg leading-7 text-zinc-600 dark:text-zinc-300">
              SecureVault X is the ultimate stash for your digital identity. We use zero-knowledge,
              end-to-end encryption to keep your vibes secure and your keys untouchable.
            </Text>
          </View>

          <View className="rounded-3xl border border-zinc-200 bg-zinc-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <Text className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">The Stack</Text>
            <Text className="text-lg leading-7 text-zinc-600 dark:text-zinc-300">
              Built with React Native, Expo, and NativeWind. Designed for maximum security and
              premium aesthetics because why settle for anything less?
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}
