import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '../../store/auth';
import { http } from '@securevault/utils-native';
import { toast } from 'sonner-native';

export default function ChangePasswordScreen() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // OTP inline state
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Real-time strength indicator logic
  const hasMinLength = newPassword.length >= 12;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isStrong = hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecial;
  const isMatch = newPassword && newPassword === confirmPassword;

  const handleContinue = async () => {
    if (!isStrong) {
      toast.error('Password does not meet strength requirements.');
      return;
    }
    if (!isMatch) {
      toast.error('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (!isOtpSent) {
        // Step 1: Request OTP
        const res = await http.post<{ success: boolean; message?: string }>(
          '/api/auth/password/change-password/request-otp',
          {}
        );

        if (res.success) {
          toast.success('OTP sent to your email.');
          setIsOtpSent(true);
        } else {
          toast.error(res.data?.message || 'Failed to request OTP');
        }
      } else {
        // Step 2: Ensure OTP is present and make the actual change password request
        if (!otp || otp.length !== 6) {
          toast.error('Please enter a valid 6-digit OTP.');
          setLoading(false);
          return;
        }

        const res = await http.post<{ success: boolean; message?: string }>(
          '/api/auth/password/change-password',
          {
            current_password: currentPassword,
            new_password: newPassword,
            otp,
          }
        );

        if (res.success) {
          toast.success('Password updated successfully');
          router.back();
        } else {
          toast.error(res.data?.message || 'Failed to update password');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'An error occurred server-side');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-1 bg-white p-6 dark:bg-[#09090b]">
        {/* Header */}
        <View className="mb-8 flex-row items-center pt-10">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={28} color={isDarkMode ? 'white' : 'black'} />
          </TouchableOpacity>
          <Text className="text-3xl font-extrabold text-zinc-900 dark:text-white">
            Change Password
          </Text>
        </View>

        <Text className="mb-6 text-zinc-500 dark:text-zinc-400">
          Update your account password. If you already have a password set, you must provide it.
        </Text>

        <View className="gap-y-4">
          <View>
            <Text className="mb-2 text-sm font-semibold uppercase text-zinc-500">
              Current Password
            </Text>
            <View className="relative justify-center">
              <TextInput
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                placeholder="Leave blank if no password is set"
                autoCapitalize="none"
                editable={!isOtpSent}
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                className={`w-full rounded-2xl border px-5 py-4 pr-12 text-zinc-900 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100 text-zinc-400 dark:border-zinc-800/50 dark:bg-zinc-800/50 dark:text-zinc-500' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50'}`}
              />
              <TouchableOpacity
                className="absolute right-4"
                onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold uppercase text-zinc-500">New Password</Text>
            <View className="relative justify-center">
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="New Password"
                autoCapitalize="none"
                editable={!isOtpSent}
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                className={`w-full rounded-2xl border px-5 py-4 pr-12 text-zinc-900 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100 text-zinc-400 dark:border-zinc-800/50 dark:bg-zinc-800/50 dark:text-zinc-500' : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50'}`}
              />
              <TouchableOpacity className="absolute right-4" onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text className="mb-2 text-sm font-semibold uppercase text-zinc-500">
              Confirm New Password
            </Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNew}
              placeholder="Confirm New Password"
              autoCapitalize="none"
              editable={!isOtpSent}
              placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
              className={`w-full rounded-2xl border bg-zinc-50 px-5 py-4 text-zinc-900 dark:bg-zinc-900/50 dark:text-white ${isOtpSent ? 'border-zinc-100 bg-zinc-100 text-zinc-400 dark:border-zinc-800/50 dark:bg-zinc-800/50 dark:text-zinc-500' : 'border-zinc-200 dark:border-zinc-800'}`}
            />
          </View>

          {isOtpSent && (
            <View className="mt-2 animate-in fade-in slide-in-from-top-2">
              <Text className="mb-2 text-sm font-semibold uppercase text-emerald-600 dark:text-emerald-500">
                Verification Code
              </Text>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="6-digit OTP"
                keyboardType="number-pad"
                maxLength={6}
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                className="w-full rounded-2xl border border-emerald-500/50 bg-emerald-50/50 px-5 py-4 text-center font-mono text-2xl tracking-widest text-zinc-900 dark:bg-emerald-500/10 dark:text-white"
              />
            </View>
          )}

          {/* Strength Indicators */}
          <View className="mt-4 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800/50 dark:bg-zinc-900/50">
            <Text className="mb-2 text-sm font-semibold uppercase text-zinc-500">
              Password Requirements
            </Text>
            <View className="mb-1 flex-row items-center">
              <Ionicons
                name={hasMinLength ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={hasMinLength ? '#10b981' : '#ef4444'}
              />
              <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">
                At least 12 characters
              </Text>
            </View>
            <View className="mb-1 flex-row items-center">
              <Ionicons
                name={hasUppercase ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={hasUppercase ? '#10b981' : '#ef4444'}
              />
              <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">
                One uppercase letter
              </Text>
            </View>
            <View className="mb-1 flex-row items-center">
              <Ionicons
                name={hasLowercase ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={hasLowercase ? '#10b981' : '#ef4444'}
              />
              <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">
                One lowercase letter
              </Text>
            </View>
            <View className="mb-1 flex-row items-center">
              <Ionicons
                name={hasDigit ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={hasDigit ? '#10b981' : '#ef4444'}
              />
              <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">One digit</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons
                name={hasSpecial ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={hasSpecial ? '#10b981' : '#ef4444'}
              />
              <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">
                One special character
              </Text>
            </View>
            <View className="mt-2 flex-row items-center border-t border-zinc-200 pt-2 dark:border-zinc-700">
              <Ionicons
                name={isMatch && newPassword ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isMatch && newPassword ? '#10b981' : '#ef4444'}
              />
              <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">Passwords match</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className={`mt-8 w-full flex-row items-center justify-center rounded-2xl py-4 transition-transform active:scale-[0.98] ${loading || !isStrong || !isMatch || (isOtpSent && otp.length !== 6)
              ? 'bg-zinc-300 dark:bg-zinc-700'
              : 'bg-emerald-500 active:bg-emerald-600'
            }`}
          disabled={loading || !isStrong || !isMatch || (isOtpSent && otp.length !== 6)}
          onPress={handleContinue}>
          <Text
            className={`text-lg font-bold ${loading || !isStrong || !isMatch || (isOtpSent && otp.length !== 6) ? 'text-zinc-500 dark:text-zinc-400' : 'text-white'}`}>
            {isOtpSent ? 'Verify & Change Password' : 'Request OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
