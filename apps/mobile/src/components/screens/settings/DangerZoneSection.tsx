import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/auth';

export default function DangerZoneSection() {
  const purgeLocalEnclave = useAuthStore((state) => state.purgeLocalEnclave);

  const handlePurge = useCallback(() => {
    Alert.alert(
      'Purge Local Enclave',
      'This will permanently destroy your local encryption keys. You will be logged out and must re-authenticate to access your vault. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purge',
          style: 'destructive',
          onPress: async () => {
            await purgeLocalEnclave();
            toast.success('Local enclave purged');
            router.replace('/');
          },
        },
      ]
    );
  }, [purgeLocalEnclave]);

  return (
    <>
      <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-red-500/80">
        Danger Zone
      </Text>
      <View className="mb-8 overflow-hidden rounded-3xl border border-red-200 bg-zinc-50 shadow-sm dark:border-red-900/40 dark:bg-zinc-900/50">
        <TouchableOpacity
          className="flex-row items-center p-5 active:bg-red-50 dark:active:bg-red-500/10"
          onPress={handlePurge}>
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10">
            <Ionicons name="warning-outline" size={22} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-red-600 dark:text-red-500">Purge Enclave</Text>
            <Text className="text-sm text-red-500/80 dark:text-red-400/80">
              Destroys local keys
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
}
