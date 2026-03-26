import React from 'react';
import { View, Text, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

export const RecordingBlockedScreen: React.FC = () => {
  return (
    <View className="absolute inset-0 z-[9999] items-center justify-center bg-black/60">
      <StatusBar barStyle="light-content" />
      <Animated.View entering={FadeIn.duration(500)} className="absolute inset-0">
        <BlurView intensity={80} tint="dark" className="flex-1 items-center justify-center px-8">
          <Animated.View
            entering={ZoomIn.delay(200)}
            className="mb-8 h-24 w-24 items-center justify-center rounded-[32px] border border-red-500/30 bg-red-500/20 shadow-2xl shadow-red-500/50"
          >
            <Ionicons name="videocam-off-outline" size={48} color="#ef4444" />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400)} className="items-center">
            <Text className="mb-4 text-center text-3xl font-bold tracking-tight text-white">
              Recording Blocked
            </Text>
            <Text className="text-center text-lg leading-7 text-zinc-300">
              SecureVault X has detected active screen recording or mirroring. Please stop it to
              continue accessing your vault.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(600)}
            className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-6 py-4"
          >
            <View className="flex-row items-center space-x-3">
              <Ionicons name="shield-checkmark-outline" size={20} color="#10b981" />
              <Text className="text-sm font-medium text-emerald-400">Your data is protected</Text>
            </View>
          </Animated.View>
        </BlurView>
      </Animated.View>
    </View>
  );
};
