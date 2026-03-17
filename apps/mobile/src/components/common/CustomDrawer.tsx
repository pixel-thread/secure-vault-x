import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import { Text, Image, View } from 'react-native';
import * as Constants from 'expo-constants';

export function CustomDrawerContent({ ...props }: DrawerContentComponentProps) {
  const insetTop = Constants.default.statusBarHeight;

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ paddingTop: insetTop + 20, flex: 1 }}>
      <View className="items-center px-6">
        <View className="h-28 w-28 items-center justify-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-2 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/10">
          <Image
            source={require('../../../assets/icon.png')}
            style={{ width: 80, height: 80 }}
            className="rounded-2xl"
          />
        </View>

        <View className="mt-6 items-center">
          <Text className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
            SecureVault <Text className="text-emerald-500">X</Text>
          </Text>
          <Text className="px-5 pt-1 text-center text-base font-normal tracking-wide text-zinc-500 dark:text-zinc-400">
            Military-grade encryption for your digital life.
          </Text>
        </View>

        <View className="my-4 h-[1px] w-full bg-emerald-500/10" />
      </View>

      <View className="px-2">
        <DrawerItemList {...props} />
      </View>
    </DrawerContentScrollView>
  );
}
