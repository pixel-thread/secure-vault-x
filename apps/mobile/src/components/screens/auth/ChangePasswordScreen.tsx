import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { http, logger } from '@securevault/utils-native';
import { toast } from 'sonner-native';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { PasswordStrength } from '@components/common/PasswordStrength';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { changePasswordSchema, changePasswordWithOutOtpSchema } from '@securevault/validators';
import { useMutation } from '@tanstack/react-query';
import { Container } from '@securevault/ui-native';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import Header from '@src/components/common/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackHeader } from '@src/components/common/StackHeader';

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

/**
 * Screen for changing the user's master password.
 * Follows the modern, Gen Z-friendly design language.
 */
const ChangePasswordScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // OTP inline state
  const [isOtpSent, setIsOtpSent] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: async (values: ChangePasswordFormData, context: any, options: any) => {
      const activeSchema = isOtpSent ? changePasswordSchema : changePasswordWithOutOtpSchema;
      const resolver = zodResolver(activeSchema);
      const result = await resolver(values, context, options);

      return result as any;
    },
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      otp: '',
    },
  });

  const watchNewPassword = watch('newPassword');
  const watchConfirmPassword = watch('confirmPassword');
  const watchOtp = watch('otp');

  const isStrong =
    watchNewPassword.length >= 12 &&
    /[A-Z]/.test(watchNewPassword) &&
    /[a-z]/.test(watchNewPassword) &&
    /[0-9]/.test(watchNewPassword) &&
    /[^A-Za-z0-9]/.test(watchNewPassword);
  const isMatch = watchNewPassword && watchNewPassword === watchConfirmPassword;

  // Mutations
  const { mutate: requestOtp, isPending: isRequestingOtp } = useMutation({
    mutationFn: () => http.post(AUTH_ENDPOINT.POST_PASSWORD_RESET_REQUEST, {}),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Code dropped in your inbox!');
        setIsOtpSent(true);
        return;
      } else {
        toast.error(res.message || 'Failed to request OTP');
        return;
      }
    },
    onError: (err: any) => {
      logger.error('Failed to request OTP', err);
      toast.error(err.response?.data?.message || 'Failed to request OTP');
    },
  });

  const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
    mutationFn: (data: ChangePasswordFormData) =>
      http.post<any>(AUTH_ENDPOINT.POST_PASSWORD_CHANGE, data),
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Password updated! Clean vibes.');
        router.back();
      } else {
        toast.error(res?.message || 'Failed to update password');
      }
    },
    onError: (err: any) => {
      logger.error('Failed to update password', err);
      toast.error(err.response?.data?.message || 'An error occurred server-side');
    },
  });

  const loading = isRequestingOtp || isChangingPassword;

  const handleContinue = async (data: ChangePasswordFormData) => {
    if (!isOtpSent) {
      requestOtp();
    } else {
      changePassword(data);
    }
  };

  return (
    <Container>
      <ScreenContainer>
        <StackHeader title="Change Password" />
        <Header title="Update the Key" subtitle="Keep it fresh, keep it safe" />

        <ScrollView contentContainerClassName="p-6 pb-20" showsVerticalScrollIndicator={false}>
          <Text className="mb-8 text-base font-medium text-zinc-500 dark:text-zinc-400">
            Refreshing your security is a power move. Drop your current key and the new one below.
          </Text>

          <View className="gap-y-6">
            <View>
              <Text className="mb-3 ml-1 text-sm font-bold uppercase tracking-widest text-zinc-400">
                The Old Key
              </Text>
              <View className="relative justify-center">
                <Controller
                  control={control}
                  name="currentPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showCurrent}
                      placeholder="Current password"
                      autoCapitalize="none"
                      editable={!isOtpSent}
                      placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                      className={`w-full rounded-2xl border px-5 py-4 pr-12 text-zinc-900 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100/50 text-zinc-400 dark:border-zinc-800/30 dark:bg-zinc-800/30 dark:text-zinc-500' : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30'}`}
                    />
                  )}
                />
                <TouchableOpacity
                  className="absolute right-4"
                  onPressIn={() => setShowCurrent(true)}
                  onPressOut={() => setShowCurrent(false)}>
                  <Ionicons name={showCurrent ? 'eye' : 'eye-off'} size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
              {errors.currentPassword && (
                <Text className="ml-1 mt-2 text-sm font-medium text-rose-500">
                  {errors.currentPassword.message}
                </Text>
              )}
            </View>

            <View>
              <Text className="mb-3 ml-1 text-sm font-bold uppercase tracking-widest text-zinc-400">
                The New Key
              </Text>
              <View className="relative justify-center">
                <Controller
                  control={control}
                  name="newPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showNew}
                      placeholder="New password"
                      autoCapitalize="none"
                      editable={!isOtpSent}
                      placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                      className={`w-full rounded-2xl border px-5 py-4 pr-12 text-zinc-900 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100/50 text-zinc-400 dark:border-zinc-800/30 dark:bg-zinc-800/30 dark:text-zinc-500' : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30'}`}
                    />
                  )}
                />
                <TouchableOpacity
                  onPressIn={() => setShowNew(true)}
                  onPressOut={() => setShowNew(false)}
                  className="absolute right-4">
                  <Ionicons name={showNew ? 'eye' : 'eye-off'} size={20} color="#71717a" />
                </TouchableOpacity>
              </View>
              {errors.newPassword && (
                <Text className="ml-1 mt-2 text-sm font-medium text-rose-500">
                  {errors.newPassword.message}
                </Text>
              )}
            </View>

            <View>
              <Text className="mb-3 ml-1 text-sm font-bold uppercase tracking-widest text-zinc-400">
                Confirm it
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry={!showNew}
                    placeholder="Repeat the new key"
                    autoCapitalize="none"
                    editable={!isOtpSent}
                    placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                    className={`w-full rounded-2xl border bg-zinc-50/50 px-5 py-4 text-zinc-900 dark:bg-zinc-900/30 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100/50 text-zinc-400 dark:border-zinc-800/30 dark:bg-zinc-800/30 dark:text-zinc-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                  />
                )}
              />
              {errors.confirmPassword && (
                <Text className="ml-1 mt-2 text-sm font-medium text-rose-500">
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {isOtpSent && (
              <View className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 dark:bg-emerald-500/10">
                <Text className="mb-3 text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Magic Code
                </Text>
                <Controller
                  control={control}
                  name="otp"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      placeholder="000000"
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholderTextColor={isDarkMode ? '#064e3b' : '#10b98150'}
                      className="w-full rounded-2xl border border-emerald-500/30 bg-white/50 px-5 py-5 text-center font-mono text-3xl font-bold tracking-[10] text-emerald-600 dark:bg-zinc-950/30 dark:text-emerald-400"
                    />
                  )}
                />
                {errors.otp && (
                  <Text className="ml-1 mt-3 text-center text-sm font-medium text-rose-500">
                    {errors.otp.message}
                  </Text>
                )}
              </View>
            )}

            {/* Strength Indicators */}
            <View className="px-1">
              <PasswordStrength
                password={watchNewPassword}
                confirmPassword={watchConfirmPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            className={`mt-10 w-full flex-row items-center justify-center rounded-2xl py-4 shadow-xl ${
              loading || !isStrong || !isMatch || (isOtpSent && watchOtp?.length !== 6)
                ? 'bg-zinc-200 dark:bg-zinc-800'
                : 'bg-emerald-500 shadow-emerald-500/20 active:scale-[0.98]'
            }`}
            disabled={loading || !isStrong || !isMatch || (isOtpSent && watchOtp?.length !== 6)}
            onPress={handleSubmit(handleContinue)}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text
                className={`text-lg font-bold ${loading || !isStrong || !isMatch || (isOtpSent && watchOtp?.length !== 6) ? 'text-zinc-400 dark:text-zinc-600' : 'text-white'}`}>
                {isOtpSent ? 'Unlock New Key' : 'Send Code'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
};

export default ChangePasswordScreen;
