import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';
import { logger } from '@securevault/utils-native';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught Application Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      logger.error("Couldn't reload app:", e);
      // Fallback if Updates.reloadAsync fails
      this.setState({ hasError: false, error: null });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#09090b]">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-12">
            <View className="flex-1 items-center justify-center">
              <View className="mb-8 h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 shadow-xl shadow-red-500/10 dark:bg-red-500/20">
                <Ionicons name="alert-circle-outline" size={56} color="#ef4444" />
              </View>

              <Text className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Something went wrong
              </Text>

              <Text className="mb-8 text-center text-lg text-zinc-500 dark:text-zinc-400">
                {`We've`} encountered an unexpected error. Our team has been notified.
              </Text>

              <View className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
                <Text className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  Quick Recovery
                </Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  Try restarting the application to resolve the issue. If the problem persists,
                  please contact support.
                </Text>
              </View>

              <View className="mt-12 w-full space-y-4">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={this.handleReset}
                  className="w-full items-center rounded-2xl bg-zinc-900 py-4 shadow-lg active:scale-[0.98] dark:bg-white">
                  <Text className="text-lg font-bold text-white dark:text-zinc-900">Try Again</Text>
                </TouchableOpacity>

                {__DEV__ && (
                  <View className="mt-8 rounded-xl bg-zinc-100 p-4 dark:bg-zinc-800/50">
                    <Text className="mb-2 font-mono text-xs font-bold text-red-600 dark:text-red-400">
                      DEBUG INFO (Dev Only)
                    </Text>
                    <Text className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                      {this.state.error?.toString()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}
