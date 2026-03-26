import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';
type Props = {
  onPressUnlock: () => void;
};
export const BioMetricLock = ({ onPressUnlock }: Props) => {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View className="items-center">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <Ionicons name="finger-print" size={48} color="#10b981" />
        </View>
        <Text className="mb-2 text-2xl font-bold text-zinc-900 dark:text-white">
          SecureVault Locked
        </Text>
        <Text className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
          Authenticate to access your vault
        </Text>
        <TouchableOpacity
          className="rounded-2xl bg-emerald-500 px-8 py-4 shadow-xl shadow-emerald-500/20 active:scale-95"
          onPress={onPressUnlock}
        >
          <Text className="text-lg font-bold text-[#022c22]">Unlock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
