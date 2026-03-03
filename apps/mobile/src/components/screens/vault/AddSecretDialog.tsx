import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { AddPasswordForm } from './AddPasswordForm';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

type Props = {
  open: boolean;
  onValueChange: (value: boolean) => void;
};
export const AddSecretDialog = ({ open: modalVisible, onValueChange: setModalVisible }: Props) => {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  return (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/60">
        <View className="m-4 max-h-[85%] rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#09090b]">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-zinc-900 dark:text-white">Add Secret</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="rounded-full bg-zinc-200 p-2 dark:bg-zinc-800/80">
              <Ionicons name="close" size={24} color={isDarkMode ? '#a1a1aa' : '#71717a'} />
            </TouchableOpacity>
          </View>

          <ScrollView
            className="mb-6"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 20 }}>
            <AddPasswordForm onSuccess={() => setModalVisible(false)} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
