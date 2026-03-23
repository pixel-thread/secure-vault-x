import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

type Props = {
  message?: string;
};

export const LoadingScreen = ({ message = 'Securing your vault...' }: Props) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
  }, [scale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={StyleSheet.absoluteFill}
      className="items-center justify-center bg-background">
      <View className="items-center justify-center">
        {/* Icon Container - Matching LoginScreen Style */}
        <Animated.View
          style={animatedIconStyle}
          className="mb-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-2 shadow-lg shadow-emerald-500/20 dark:bg-emerald-500/10">
          <Image
            source={require('../../../assets/icon.png')}
            width={100}
            height={100}
            className="max-h-[150px] max-w-[150px] rounded-3xl"
          />
        </Animated.View>

        {/* Text FadeIn - Matching LoginScreen Typography */}
        <Animated.View
          entering={FadeIn.delay(200).duration(800)}
          exiting={FadeOut}
          className="items-center">
          <Text className="text-4xl font-extrabold tracking-tighter text-zinc-900 dark:text-white">
            SecureVault <Text className="text-emerald-500">X</Text>
          </Text>
          <Text className="mt-3 text-center text-base font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            {message}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};
