import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useMutation } from '@tanstack/react-query';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { http } from '@securevault/utils-native';
import { tokenManager } from '@securevault/libs';
import { toast } from 'sonner-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../../store/auth';
import * as SecureStore from 'expo-secure-store';

export default function SignOutButton() {
 const { colorScheme } = useColorScheme();
 const isDarkMode = colorScheme === 'dark';
 const { logout, setIsLoading } = useAuthStore();

 const { mutate: logoutMutate } = useMutation({
  mutationFn: (token: string) =>
   http.post<null>(AUTH_ENDPOINT.POST_LOGOUT, { refreshToken: token }),
  onSuccess: async (data) => {
   if (data.success) {
    await tokenManager.removeAllTokens();
    await SecureStore.deleteItemAsync('SV_DEVICE_ID');
    await SecureStore.deleteItemAsync('SV_DEVICE_ID_RESERVE');
    await SecureStore.deleteItemAsync('SV_DEVICE_PRIVATE_KEY');
    toast.success('Signed out successfully');
    logout();
    setIsLoading(false);
    router.push('/auth');
   }
  },
 });

 const handleLogout = async () => {
  setIsLoading(true);
  const refreshToken = await tokenManager.getRefreshToken();
  if (!refreshToken) return;
  logoutMutate(refreshToken);
 };

 return (
  <TouchableOpacity
   className="mb-6 mt-auto w-full flex-row items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 py-4 shadow-sm active:bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-900/80 dark:active:bg-zinc-800"
   onPress={handleLogout}>
   <Ionicons name="log-out-outline" size={22} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
   <Text className="ml-2 text-lg font-bold text-zinc-600 dark:text-zinc-300">
    Sign Out Device
   </Text>
  </TouchableOpacity>
 );
}
