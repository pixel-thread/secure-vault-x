import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { http, logger } from '@securevault/utils-native';
import { toast } from 'sonner-native';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { PasswordStrength } from '../../common/PasswordStrength';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const ChangePasswordScreen = () => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // OTP inline state
  const [isOtpSent, setIsOtpSent] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    getValues,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
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

  const handleContinue = async (data: ChangePasswordFormData) => {
    setLoading(true);

    try {
      if (!isOtpSent) {
        // Step 1: Request OTP
        const res = await http.post<{ success: boolean; message?: string }>(
          AUTH_ENDPOINT.POST_PASSWORD_RESET_REQUEST,
          {}
        );

        if (res.success) {
          toast.success('OTP sent to your email.');
          setIsOtpSent(true);
        } else {
          toast.error(res.message || 'Failed to request OTP');
        }
      } else {
        // Step 2: Ensure OTP is present and make the actual change password request
        if (!data.otp || data.otp.length !== 6) {
          toast.error('Please enter a valid 6-digit OTP.');
          setLoading(false);
          return;
        }

        const res = await http.post<any>(AUTH_ENDPOINT.POST_PASSWORD_CHANGE, {
          current_password: data.currentPassword,
          new_password: data.newPassword,
          otp: data.otp,
        });

        if (res.success) {
          toast.success(res.message);
          router.back();
        } else {
          toast.error(res?.message || 'Failed to update password');
        }
      }
    } catch (err: any) {
      logger.error('Failed to update password', {
        message: err.message,
        stack: err.stack,
      });
      toast.error(err.response?.data?.message || 'An error occurred server-side');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Change Password',
          title: 'Change Password',
          headerStyle: { backgroundColor: isDarkMode ? '#09090b' : '#fff' },
          headerTintColor: isDarkMode ? '#fff' : '#000',
          headerTitleStyle: { color: isDarkMode ? '#fff' : '#000' },
        }}
      />
      <View className="flex-1 bg-white p-6 dark:bg-[#09090b]">
        <Text className="mb-6 text-zinc-500 dark:text-zinc-400">
          Update your account password. If you already have a password set, you must provide it.
        </Text>

        <View className="gap-y-4">
          <View>
            <Text className="mb-2 text-sm font-semibold uppercase text-zinc-500">
              Current Password
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
                    placeholder="Leave blank if no password is set"
                    autoCapitalize="none"
                    editable={!isOtpSent}
                    placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                    className={`w-full rounded-2xl border px-5 py-4 pr-12 text-zinc-900 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100 text-zinc-400 dark:border-zinc-800/50 dark:bg-zinc-800/50 dark:text-zinc-500' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50'}`}
                  />
                )}
              />
              <TouchableOpacity
                className="absolute right-4"
                onPressIn={() => setShowCurrent(true)}
                onPressOut={() => setShowCurrent(false)}>
                <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
            {errors.currentPassword && (
              <Text className="ml-1 mt-1 text-xs text-red-500">
                {errors.currentPassword.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold uppercase text-zinc-500">New Password</Text>
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
                    placeholder="New Password"
                    autoCapitalize="none"
                    editable={!isOtpSent}
                    placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                    className={`w-full rounded-2xl border px-5 py-4 pr-12 text-zinc-900 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100 text-zinc-400 dark:border-zinc-800/50 dark:bg-zinc-800/50 dark:text-zinc-500' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50'}`}
                  />
                )}
              />
              <TouchableOpacity
                onPressIn={() => setShowNew(true)}
                onPressOut={() => setShowNew(false)}
                className="absolute right-4">
                <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
            {errors.newPassword && (
              <Text className="ml-1 mt-1 text-xs text-red-500">{errors.newPassword.message}</Text>
            )}
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold uppercase text-zinc-500">
              Confirm New Password
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
                  placeholder="Confirm New Password"
                  autoCapitalize="none"
                  editable={!isOtpSent}
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  className={`w-full rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 dark:bg-zinc-900/50 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100 text-zinc-400 dark:border-zinc-800/50 dark:bg-zinc-800/50 dark:text-zinc-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text className="ml-1 mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          {isOtpSent && (
            <View className="animate-in fade-in slide-in-from-top-2 mt-2">
              <Text className="mb-2 text-sm font-semibold uppercase text-emerald-600 dark:text-emerald-500">
                Verification Code
              </Text>
              <Controller
                control={control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholder="6-digit OTP"
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                    className="w-full rounded-2xl border border-emerald-500/50 bg-emerald-50/50 px-5 py-4 text-center font-mono text-2xl tracking-widest text-zinc-900 dark:bg-emerald-500/10 dark:text-white"
                  />
                )}
              />
              {errors.otp && (
                <Text className="ml-1 mt-1 text-xs text-red-500">{errors.otp.message}</Text>
              )}
            </View>
          )}

          {/* Strength Indicators */}
          <PasswordStrength password={watchNewPassword} confirmPassword={watchConfirmPassword} />
        </View>

        <TouchableOpacity
          className={`mt-8 w-full flex-row items-center justify-center rounded-2xl py-4 transition-transform active:scale-[0.98] ${
            loading || !isStrong || !isMatch || (isOtpSent && watchOtp?.length !== 6)
              ? 'bg-zinc-300 dark:bg-zinc-700'
              : 'bg-emerald-500 active:bg-emerald-600'
          }`}
          disabled={loading || !isStrong || !isMatch || (isOtpSent && watchOtp?.length !== 6)}
          onPress={handleSubmit(handleContinue)}>
          <Text
            className={`text-lg font-bold ${loading || !isStrong || !isMatch || (isOtpSent && watchOtp?.length !== 6) ? 'text-zinc-500 dark:text-zinc-400' : 'text-white'}`}>
            {isOtpSent ? 'Verify & Change Password' : 'Request OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ChangePasswordScreen;
