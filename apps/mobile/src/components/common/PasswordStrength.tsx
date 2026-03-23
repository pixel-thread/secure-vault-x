import { View, Text } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  password: string;
  confirmPassword?: string;
};

export const PasswordStrength = (
  { password, confirmPassword }: Props = { password: '', confirmPassword: '' },
) => {
  const hasMinLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isMatch = password && password === confirmPassword;

  return (
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
        <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">One uppercase letter</Text>
      </View>
      <View className="mb-1 flex-row items-center">
        <Ionicons
          name={hasLowercase ? 'checkmark-circle' : 'close-circle'}
          size={16}
          color={hasLowercase ? '#10b981' : '#ef4444'}
        />
        <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">One lowercase letter</Text>
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
        <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">One special character</Text>
      </View>
      <View className="mt-2 flex-row items-center border-t border-zinc-200 pt-2 dark:border-zinc-700">
        <Ionicons
          name={isMatch && password ? 'checkmark-circle' : 'close-circle'}
          size={16}
          color={isMatch && password ? '#10b981' : '#ef4444'}
        />
        <Text className="ml-2 text-xs text-zinc-600 dark:text-zinc-400">Passwords match</Text>
      </View>
    </View>
  );
};
