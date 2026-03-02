import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/auth';
import { useColorScheme } from 'nativewind';
import Header from '../../Header';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner-native';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { http } from '@securevault/utils-native';
import { tokenManager } from '@securevault/libs';

export default function SettingsScreen() {
  const { logout, setIsLoading } = useAuthStore();
  const purgeLocalEnclave = useAuthStore((state) => state.purgeLocalEnclave);
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { mutate } = useMutation({
    mutationFn: () => http.post<null>(AUTH_ENDPOINT.POST_LOGOUT),
    onSuccess: async (data) => {
      if (data.success) {
        await tokenManager.removeAllTokens();
        toast.success('Logout successfully', {
          description: data.message,
        });
        logout();
        setIsLoading(false);
        router.push('/auth');
      }
    },
  });

  const handleLogout = () => {
    setIsLoading(true);
    mutate();
  };

  const handlePurge = async () => {
    await purgeLocalEnclave();
    router.replace('/');
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#09090b]">
      <Header title="Settings" subtitle="Device Preferences" />

      <ScrollView
        className="flex-1 p-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          App Appearance
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <TouchableOpacity
            className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
            onPress={toggleColorScheme}>
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">Dark Mode</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                {isDarkMode ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <Ionicons name="swap-horizontal-outline" size={20} color="#71717a" />
          </TouchableOpacity>
        </View>

        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Security Controls
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <TouchableOpacity className="flex-row items-center border-b border-zinc-100 p-5 active:bg-zinc-200 dark:border-zinc-800/50 dark:active:bg-zinc-800/60">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="hardware-chip-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">Hardware Keys</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">Manage NFC/USB Keys</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                Security Preferences
              </Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Biometrics & Auto-lock
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </TouchableOpacity>
        </View>

        <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Sync & Devices
        </Text>
        <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <TouchableOpacity className="flex-row items-center border-b border-zinc-100 p-5 active:bg-zinc-200 dark:border-zinc-800/50 dark:active:bg-zinc-800/60">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="phone-portrait-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                Trusted Devices
              </Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Manage paired devices
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center border-b border-zinc-100 p-5 active:bg-zinc-200 dark:border-zinc-800/50 dark:active:bg-zinc-800/60">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="server-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                Sync Configuration
              </Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Server endpoints & polling
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60">
            <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
              <Ionicons
                name="download-outline"
                size={22}
                color={isDarkMode ? '#10b981' : '#059669'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-zinc-900 dark:text-white">Export Vault</Text>
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                Download encrypted backup
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#71717a" />
          </TouchableOpacity>
        </View>

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
              <Text className="text-lg font-bold text-red-600 dark:text-red-500">
                Purge Enclave
              </Text>
              <Text className="text-sm text-red-500/80 dark:text-red-400/80">
                Destroys local keys
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className="mb-6 mt-auto w-full flex-row items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 py-4 shadow-sm active:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:active:bg-zinc-800"
          onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
          <Text className="ml-2 text-lg font-bold text-zinc-600 dark:text-zinc-300">
            Sign Out Device
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
