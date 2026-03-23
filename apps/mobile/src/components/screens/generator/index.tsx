import { Ionicons } from '@expo/vector-icons';
import { Container } from '@securevault/ui-native';
import { generatePassword } from '@securevault/utils';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from 'nativewind';
import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { toast } from 'sonner-native';
import Header from '@components/common/Header';
import { ScreenContainer } from '@src/components/common/ScreenContainer';
import { useVaultContext } from '@hooks/vault/useVaultContext';

/**
 * Renders the password generator screen for creating cryptographically strong secrets.
 * Futuristic Redesign with Glassmorphism and Card Toggles.
 */
export default function GeneratorScreen() {
  const { sync, isLoading } = useVaultContext();
  const [password, setPassword] = useState('Tap Generate');
  const [length, setLength] = useState(32);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const generate = () => {
    const generated = generatePassword(length, {
      useLowercase,
      useUppercase,
      useNumbers,
      useSymbols,
    });
    setPassword(generated);
  };

  const handleCopy = async () => {
    if (password === 'Tap Generate') return;

    const current = await Clipboard.getStringAsync();

    if (current === password) return;

    await Clipboard.setStringAsync(password);
    toast.success('Say Less', {
      description: 'Password is in your clipboard... vibes.',
    });
  };

  // --- STRENGTH LOGIC ---
  const strength = useMemo(() => {
    if (password === 'Tap Generate') return { label: 'Idle', color: 'text-zinc-400', percent: 0 };
    let score = 0;
    if (length >= 12) score += 1;
    if (length >= 24) score += 1;
    if (useUppercase) score += 1;
    if (useNumbers) score += 1;
    if (useSymbols) score += 1;

    if (score <= 2) return { label: 'Mid', color: 'text-amber-500', percent: 33 };
    if (score <= 4) return { label: 'Strong', color: 'text-emerald-500', percent: 66 };
    return { label: 'Untouchable', color: 'text-emerald-400', percent: 100 };
  }, [password, length, useUppercase, useNumbers, useSymbols]);

  // --- RENDER HELPERS ---
  const ToggleCard = ({
    label,
    active,
    onPress,
    icon,
  }: {
    label: string;
    active: boolean;
    onPress: () => void;
    icon: string;
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className={`mb-4 w-[48%] items-center justify-center rounded-3xl border p-5 active:scale-95 ${
        active
          ? 'border-emerald-500/50 bg-emerald-500/10 dark:bg-emerald-500/20'
          : 'border-zinc-200 bg-zinc-100/30 dark:border-zinc-800/80 dark:bg-zinc-900/30'
      }`}
    >
      <View
        className={`mb-3 h-12 w-12 items-center justify-center rounded-2xl ${
          active ? 'bg-emerald-500/20' : 'bg-zinc-200/50 dark:bg-zinc-800'
        }`}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={active ? '#10b981' : isDarkMode ? '#71717a' : '#a1a1aa'}
        />
      </View>
      <Text
        className={`font-bold tracking-tight ${
          active ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Container isSafe={false}>
      <Header title="The Key Smith" subtitle="Unbreakable Energy" />

      <ScreenContainer>
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isLoading.isSyncing}
              onRefresh={sync}
              tintColor="#10b981"
              colors={['#10b981']}
            />
          }
        >
          <View className="mt-6 overflow-hidden rounded-[32px] border border-zinc-200 bg-white shadow-2xl shadow-emerald-500/10 dark:border-white/10 dark:bg-zinc-900/80">
            <View className="items-center justify-center p-8">
              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.7}
                className="items-center justify-center"
              >
                <Text
                  numberOfLines={2}
                  className="mb-2 text-center font-mono text-3xl font-extrabold tracking-widest text-emerald-600 dark:text-emerald-400"
                >
                  {password}
                </Text>

                <View className="flex-row items-center justify-center rounded-full bg-emerald-500/10 px-4 py-1">
                  <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                  <Text
                    className={`ml-1.5 text-xs font-bold uppercase tracking-widest ${strength.color}`}
                  >
                    {strength.label}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Strength Bar */}
          <View className="mt-4 h-1.5 w-full flex-row gap-1 px-4">
            {[33, 66, 100].map((step) => (
              <View
                key={step}
                className={`flex-1 rounded-full ${
                  strength.percent >= step
                    ? step === 100
                      ? 'bg-emerald-400'
                      : 'bg-emerald-500'
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            ))}
          </View>

          <View className="mt-10">
            <Text className="mb-4 ml-1 text-sm font-bold uppercase tracking-[4px] text-zinc-400 dark:text-zinc-500">
              Entropy Config
            </Text>

            <View className="mb-6 flex-row items-center justify-between rounded-3xl border border-zinc-200 bg-zinc-100/30 p-6 dark:border-zinc-800/80 dark:bg-zinc-900/30">
              <View>
                <Text className="text-xl font-black text-zinc-900 dark:text-white">
                  {length}{' '}
                  <Text className="font-medium text-zinc-400 dark:text-zinc-600">Chars</Text>
                </Text>
                <Text className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  Length Constraint
                </Text>
              </View>

              <View className="flex-row items-center rounded-2xl bg-zinc-200/50 p-1.5 dark:bg-zinc-800/50">
                <TouchableOpacity
                  onPress={() => setLength(Math.max(8, length - 1))}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-300/50 active:scale-90 dark:bg-zinc-700/50"
                >
                  <Ionicons name="remove" size={20} color="#10b981" />
                </TouchableOpacity>
                <View className="w-4" />
                <TouchableOpacity
                  onPress={() => setLength(Math.min(64, length + 1))}
                  className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-300/50 active:scale-90 dark:bg-zinc-700/50"
                >
                  <Ionicons name="add" size={20} color="#10b981" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
              <ToggleCard
                label="Lowercase"
                active={useLowercase}
                onPress={() => setUseLowercase(!useLowercase)}
                icon="text-outline"
              />
              <ToggleCard
                label="Uppercase"
                active={useUppercase}
                onPress={() => setUseUppercase(!useUppercase)}
                icon="text"
              />
              <ToggleCard
                label="Numbers"
                active={useNumbers}
                onPress={() => setUseNumbers(!useNumbers)}
                icon="keypad-outline"
              />
              <ToggleCard
                label="Symbols"
                active={useSymbols}
                onPress={() => setUseSymbols(!useSymbols)}
                icon="flash-outline"
              />
            </View>
          </View>

          <TouchableOpacity
            className="mt-6 overflow-hidden rounded-3xl shadow-xl shadow-emerald-500/30 active:scale-95"
            onPress={generate}
          >
            <View className="flex-row items-center justify-center bg-emerald-500 py-5">
              <Ionicons name="sparkles" size={24} color="#022c22" />
              <Text className="ml-3 text-xl font-black uppercase tracking-widest text-[#022c22]">
                Engage Forge
              </Text>
            </View>
          </TouchableOpacity>

          <View className="h-24" />
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}
