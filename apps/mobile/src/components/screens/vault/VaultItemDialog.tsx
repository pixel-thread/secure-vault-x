import { VaultSecretT } from '@/src/type/vault';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useColorScheme } from 'nativewind';
import { Modal, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { toast } from 'sonner-native';

type Props = {
  open: boolean;
  onValueChange: (value: boolean) => void;
  item: VaultSecretT;
};

export const VaultItemDialog = ({ open, onValueChange, item: selectedSecret }: Props) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Modal visible={open} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/60">
        <View className="m-4 max-h-[85%] rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#09090b]">
          {selectedSecret && (
            <>
              <View className="mb-6 flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {selectedSecret.serviceName}
                </Text>
                <TouchableOpacity
                  onPress={() => onValueChange(false)}
                  className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-800/80">
                  <Ionicons name="close" size={24} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
                {selectedSecret.type === 'password' ? (
                  <>
                    {selectedSecret.website ? (
                      <View className="mb-4">
                        <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Website URL
                        </Text>
                        <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                          <Text className="flex-1 text-zinc-900 dark:text-white">
                            {selectedSecret.website}
                          </Text>
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => Linking.openURL(selectedSecret.website)}>
                            <Ionicons name="open-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    <View className="mb-4">
                      <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Username
                      </Text>
                      <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <Text className="flex-1 text-zinc-900 dark:text-white">
                          {selectedSecret.username}
                        </Text>
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => {
                            Clipboard.setStringAsync(selectedSecret.username);
                            toast.success('Username copied');
                          }}>
                          <Ionicons name="copy-outline" size={22} color="#10b981" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="mb-4">
                      <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Password
                      </Text>
                      <TouchableOpacity
                        className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 active:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900/50 dark:active:bg-zinc-800/60"
                        onPress={() => {
                          Clipboard.setStringAsync(selectedSecret.secretInfo);
                          toast.success('Password copied');
                        }}>
                        <Text className="flex-1 text-xl tracking-[0.2em] text-zinc-900 dark:text-white">
                          ••••••••••••
                        </Text>
                        <Ionicons name="copy-outline" size={22} color="#10b981" />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View className="mb-4">
                      <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Cardholder Name
                      </Text>
                      <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <Text className="flex-1 text-zinc-900 dark:text-white">
                          {selectedSecret.cardholderName}
                        </Text>
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => {
                            Clipboard.setStringAsync(selectedSecret.cardholderName);
                            toast.success('Name copied');
                          }}>
                          <Ionicons name="copy-outline" size={22} color="#10b981" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="mb-4">
                      <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Card Number
                      </Text>
                      <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                        <Text className="flex-1 font-mono text-zinc-900 dark:text-white">
                          {selectedSecret.cardNumber}
                        </Text>
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => {
                            Clipboard.setStringAsync(selectedSecret.cardNumber);
                            toast.success('Card number copied');
                          }}>
                          <Ionicons name="copy-outline" size={22} color="#10b981" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View className="mb-4 flex-row gap-4">
                      <View className="flex-1">
                        <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Expires
                        </Text>
                        <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                          <Text className="flex-1 text-zinc-900 dark:text-white">
                            {selectedSecret.expirationDate}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          CVV
                        </Text>
                        <View className="flex-row items-center rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                          <Text className="flex-1 text-zinc-900 dark:text-white">***</Text>
                          <TouchableOpacity
                            className="p-1"
                            onPress={() => {
                              Clipboard.setStringAsync(selectedSecret.cvv);
                              toast.success('CVV copied');
                            }}>
                            <Ionicons name="copy-outline" size={22} color="#10b981" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </>
                )}

                {selectedSecret.note ? (
                  <View className="mb-4">
                    <Text className="mb-1 ml-1 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Note
                    </Text>
                    <View className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <Text className="text-zinc-900 dark:text-white">{selectedSecret.note}</Text>
                    </View>
                  </View>
                ) : null}

                <TouchableOpacity
                  className="mb-4 mt-2 w-full flex-row items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 py-4 shadow-xl active:scale-[0.98] dark:border-red-500/20 dark:bg-red-500/10"
                  onPress={() => {
                    Alert.alert(
                      'Delete Secret',
                      'Are you sure you want to delete this item? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {},
                        },
                      ]
                    );
                  }}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  <Text className="ml-2 text-lg font-bold text-red-500">
                    Delete {selectedSecret.type === 'password' ? 'Password' : 'Card'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
