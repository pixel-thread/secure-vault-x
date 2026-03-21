import { Ionicons } from '@expo/vector-icons';
import { Container } from '@securevault/ui-native';
import { generatePassword } from '@securevault/utils';
import * as Clipboard from 'expo-clipboard';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { View, Text, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { toast } from 'sonner-native';
import Header from '@components/common/Header';
import { ScreenContainer } from '@src/components/common/ScreenContainer';

/**
 * Renders the password generator screen for creating cryptographically strong secrets.
 */
export default function GeneratorScreen() {
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
    await Clipboard.setStringAsync(password);
    toast.success('Locked & Loaded!', {
      description: 'Password is in your clipboard.',
    });
  };

  return (
    <Container>
      <Header 
        title="The Key Smith" 
        subtitle="Unbreakable Energy" 
      />

      <ScreenContainer>
        <ScrollView
          className="flex-1 p-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity
            onPress={handleCopy}
            activeOpacity={0.7}
            className="mb-8 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 shadow-lg shadow-emerald-500/10">
            <Text 
              numberOfLines={2}
              className="text-center font-mono text-3xl font-medium tracking-wider text-emerald-600 dark:text-emerald-400">
              {password}
            </Text>
          </TouchableOpacity>

          <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
              Length: {length}
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setLength(Math.max(8, length - 1))}
                className="mr-3 rounded-full bg-zinc-200 p-2 active:bg-zinc-300 dark:bg-zinc-800/80 dark:active:bg-zinc-700">
                <Ionicons name="remove" size={24} color="#10b981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setLength(Math.min(64, length + 1))}
                className="rounded-full bg-zinc-200 p-2 active:bg-zinc-300 dark:bg-zinc-800/80 dark:active:bg-zinc-700">
                <Ionicons name="add" size={24} color="#10b981" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white">Lowercase (a-z)</Text>
            <Switch
              value={useLowercase}
              onValueChange={setUseLowercase}
              trackColor={{ false: isDarkMode ? '#27272a' : '#d4d4d8', true: '#10b981' }}
              thumbColor={useLowercase ? '#fff' : isDarkMode ? '#a1a1aa' : '#71717a'}
            />
          </View>

          <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white">Uppercase (A-Z)</Text>
            <Switch
              value={useUppercase}
              onValueChange={setUseUppercase}
              trackColor={{ false: isDarkMode ? '#27272a' : '#d4d4d8', true: '#10b981' }}
              thumbColor={useUppercase ? '#fff' : isDarkMode ? '#a1a1aa' : '#71717a'}
            />
          </View>

          <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white">Numbers (0-9)</Text>
            <Switch
              value={useNumbers}
              onValueChange={setUseNumbers}
              trackColor={{ false: isDarkMode ? '#27272a' : '#d4d4d8', true: '#10b981' }}
              thumbColor={useNumbers ? '#fff' : isDarkMode ? '#a1a1aa' : '#71717a'}
            />
          </View>

          <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <Text className="text-lg font-semibold text-zinc-900 dark:text-white">Symbols (!@#$)</Text>
            <Switch
              value={useSymbols}
              onValueChange={setUseSymbols}
              trackColor={{ false: isDarkMode ? '#27272a' : '#d4d4d8', true: '#10b981' }}
              thumbColor={useSymbols ? '#fff' : isDarkMode ? '#a1a1aa' : '#71717a'}
            />
          </View>

          <TouchableOpacity
            className="mt-6 flex-row items-center justify-center rounded-2xl bg-emerald-500 py-4 shadow-xl shadow-emerald-500/20 active:scale-[0.98] active:bg-emerald-600"
            onPress={generate}>
            <Ionicons name="refresh-outline" size={24} color="#022c22" />
            <Text className="ml-2 text-xl font-bold text-[#022c22]">Forge Identity</Text>
          </TouchableOpacity>
          
          <View className="h-20" />
        </ScrollView>
      </ScreenContainer>
    </Container>
  );
}

