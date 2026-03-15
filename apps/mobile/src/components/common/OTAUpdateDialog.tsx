import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';

interface OTAUpdateDialogProps {
 isVisible: boolean;
 onUpdate: () => void;
 onCancel: () => void;
}

export const OTAUpdateDialog: React.FC<OTAUpdateDialogProps> = ({
 isVisible,
 onUpdate,
 onCancel,
}) => {
 const { colorScheme } = useColorScheme();
 const isDarkMode = colorScheme === 'dark';

 return (
  <Modal
   transparent
   visible={isVisible}
   animationType="fade"
   statusBarTranslucent
  >
   <View className="flex-1 items-center justify-center bg-black/40 px-6">
    <Animated.View
     entering={ZoomIn}
     className="w-full overflow-hidden rounded-[32px] border border-white/20 bg-white/80 shadow-2xl dark:border-white/10 dark:bg-zinc-900/90"
    >
     <BlurView
      intensity={isDarkMode ? 30 : 50}
      tint={isDarkMode ? 'dark' : 'light'}
      className="p-8"
     >
      <View className="items-center">
       <Animated.View
        entering={FadeInDown.delay(200)}
        className="mb-6 h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20"
       >
        <Ionicons name="rocket-outline" size={40} color="#10b981" />
       </Animated.View>

       <Animated.Text
        entering={FadeInUp.delay(300)}
        className="mb-2 text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-white"
       >
        Update Available
       </Animated.Text>

       <Animated.Text
        entering={FadeInUp.delay(400)}
        className="mb-8 text-center text-base leading-6 text-zinc-500 dark:text-zinc-400"
       >
        A new version of SecureVault is ready. Reboot to apply the latest security patches and features.
       </Animated.Text>

       <View className="w-full space-y-3">
        <TouchableOpacity
         activeOpacity={0.8}
         onPress={onUpdate}
         className="w-full items-center rounded-2xl bg-zinc-900 py-4 shadow-lg active:scale-[0.98] dark:bg-white"
        >
         <Text className="text-lg font-bold text-white dark:text-zinc-900">
          Update Now
         </Text>
        </TouchableOpacity>

        <TouchableOpacity
         activeOpacity={0.7}
         onPress={onCancel}
         className="w-full items-center py-2"
        >
         <Text className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
          Maybe Later
         </Text>
        </TouchableOpacity>
       </View>
      </View>
     </BlurView>
    </Animated.View>
   </View>
  </Modal>
 );
};
