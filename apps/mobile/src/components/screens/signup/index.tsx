import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { router, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { passwordRegisterSchema } from '@securevault/validators';
import { useMutation } from '@tanstack/react-query';
import { http } from '@securevault/utils-native';
import { AUTH_ENDPOINT } from '@securevault/constants';
import { toast } from 'sonner-native';
import { useState } from 'react';

type FormValue = {
  email: string;
  password: string;
  confirmPassword: string;
};

type ApiRes = {
  accessToken: string;
  refreshToken: string;
};

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValue>({
    resolver: zodResolver(passwordRegisterSchema),
    defaultValues: {
      email: process.env.EMAIL || '',
      password: process.env.PASSWORD || '',
      confirmPassword: process.env.PASSWORD || '',
    },
  });

  const { colorScheme } = useColorScheme();

  const isDarkMode = colorScheme === 'dark';

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValue) => http.post<ApiRes>(AUTH_ENDPOINT.POST_PASSWORD_REGISTER, data),
    onSuccess: async (data) => {
      if (data.success) {
        toast.success('Account Created!', { description: data.message });
        router.replace('/auth');
        return data.data;
      } else {
        toast.error('Registration Failed', { description: data.message || 'Please try again.' });
        return data;
      }
    },
  });

  const onSubmit = async (data: FormValue) => mutate(data);
  console.log(errors);
  return (
    <View className="flex-1 items-center justify-center bg-white p-8 dark:bg-[#09090b]">
      <View className="mb-12 items-center">
        <View className="mb-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/10">
          <Ionicons name="person-add" size={48} color="#10b981" />
        </View>
        <Text className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
          Create Account
        </Text>
        <Text className="mt-3 text-center text-base font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          Join SecureVault X today.
        </Text>
      </View>

      <View className="w-full max-w-sm gap-y-4">
        <View>
          <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Email
          </Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`w-full rounded-2xl border bg-zinc-50 px-5 py-4 text-lg text-zinc-900 focus:bg-white dark:bg-zinc-900/50 dark:text-white dark:focus:bg-zinc-900 ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-zinc-200 focus:border-emerald-500/50 dark:border-zinc-800'
                }`}
                placeholder="Email Address"
                placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            )}
          />
          {errors.email && (
            <Text className="ml-1 mt-1 text-sm text-red-500">{errors.email.message}</Text>
          )}
        </View>

        <View>
          <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Password
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center rounded-2xl border bg-zinc-50 pr-2 dark:bg-zinc-900/50 ${
                  errors.password ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}>
                <TextInput
                  className="flex-1 px-5 py-4 text-zinc-900 focus:bg-white dark:text-white dark:focus:bg-zinc-900/10"
                  placeholder="Password"
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="p-3"
                  onPressIn={() => setShowPassword(true)}
                  onPressOut={() => setShowPassword(false)}
                  delayPressIn={0}>
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color={showPassword ? '#10b981' : '#71717a'}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text className="ml-1 mt-1 text-sm text-red-500">{errors.password.message}</Text>
          )}
        </View>

        <View>
          <Text className="mb-2 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Confirm Password
          </Text>
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center rounded-2xl border bg-zinc-50 pr-2 dark:bg-zinc-900/50 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'
                }`}>
                <TextInput
                  className="flex-1 px-5 py-4 text-zinc-900 focus:bg-white dark:text-white dark:focus:bg-zinc-900/10"
                  placeholder="Confirm Password"
                  placeholderTextColor={isDarkMode ? '#52525b' : '#a1a1aa'}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  className="p-3"
                  onPressIn={() => setShowPassword(true)}
                  onPressOut={() => setShowPassword(false)}
                  delayPressIn={0}>
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={22}
                    color={showPassword ? '#10b981' : '#71717a'}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.confirmPassword && (
            <Text className="ml-1 mt-1 text-sm text-red-500">{errors.confirmPassword.message}</Text>
          )}
        </View>

        <TouchableOpacity
          className="mt-4 w-full flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 transition-transform active:scale-[0.98] active:bg-emerald-600"
          disabled={isPending}
          onPress={handleSubmit(onSubmit)}>
          <Ionicons name="person-add-outline" size={24} color="#064e3b" />
          <Text className="ml-2 text-lg font-bold text-[#022c22]">Sign Up</Text>
        </TouchableOpacity>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-zinc-500 dark:text-zinc-400">Already have an account? </Text>
          <Link href="/auth" asChild>
            <TouchableOpacity>
              <Text className="font-bold text-emerald-600 dark:text-emerald-500">Log in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}
