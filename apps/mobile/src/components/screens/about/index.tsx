import { View, Text, ScrollView } from 'react-native';
import Header from '../../common/Header';

export default function AboutScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-[#09090b]">
      <Header title="About" subtitle="SecureVault X" />
      <ScrollView className="flex-1 p-6">
        <Text className="mb-4 text-lg text-zinc-600 dark:text-zinc-300">
          SecureVault X is a next-generation password manager that ensures zero-knowledge end-to-end
          encryption.
        </Text>
        <Text className="text-lg text-zinc-600 dark:text-zinc-300">
          Built with React Native, Expo, and NativeWind, this application prioritizes both security
          and premium aesthetics.
        </Text>
      </ScrollView>
    </View>
  );
}
