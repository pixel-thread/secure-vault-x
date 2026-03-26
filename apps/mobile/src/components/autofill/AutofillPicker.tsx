import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Dimensions,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { PasswordManager, Credential } from '@utils/PasswordManager';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useVaultContext } from '@src/hooks/vault/useVaultContext';
import { logger } from '@securevault/utils-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { normalizeCredentailSearch } from '@src/utils/helper/normalizeCredentailsSearch';
import { useThemeStore } from '@src/store/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AutofillPickerProps {
  siteKey: string | null;
  onClose: () => void;
}

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const AutofillPicker: React.FC<AutofillPickerProps> = ({ siteKey, onClose }) => {
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);
  const { isDarkMode } = useThemeStore();

  // States for unpaginated search
  const [allCredentials, setAllCredentials] = useState<Credential[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(true);

  const {
    getVaultItems,
    sync,
    isLoading: { isSyncing },
  } = useVaultContext();

  const fetchAllLogins = useCallback(async () => {
    try {
      setIsLoadingAll(true);
      logger.info('[PICKER] Fetching all login credentials for matching...');

      // Fetch a large batch to bypass UI pagination (OWASP: High Performance / Availability)
      const items = await getVaultItems({ limit: 1000 });

      const credentials = items
        .filter((item) => item.type === 'login')
        .map((item) => {
          const usernameField = item.fields.find(
            (f) => f.id === 'username' || f.id === 'user' || f.label.toLowerCase() === 'username',
          );
          const passwordField = item.fields.find(
            (f) => f.id === 'password' || f.id === 'pass' || f.type === 'password',
          );
          return {
            id: item.id,
            username: usernameField?.value || 'Unknown User',
            password: passwordField?.value || '',
            // We also need the fields for fuzzy matching in the next step
            _rawItem: item,
          } as Credential & { _rawItem: any };
        });

      setAllCredentials(credentials);
    } catch (err) {
      logger.error('[PICKER] Failed to fetch full vault', { error: err });
    } finally {
      setIsLoadingAll(false);
    }
  }, [getVaultItems]);

  const matchedCredentials = useMemo(() => {
    if (!siteKey || allCredentials.length === 0) return [];
    const normSite = normalizeCredentailSearch(siteKey);

    return allCredentials.filter((cred: any) => {
      const item = cred._rawItem;
      const normTitle = normalizeCredentailSearch(item.title || '');

      // Match by title
      if (normTitle.includes(normSite) || normSite.includes(normTitle)) return true;

      // Match by sub-fields (URLs/Websites)
      return item.fields.some((f: any) => {
        if (f.type === 'url' || f.label.toLowerCase() === 'website') {
          const normUrl = normalizeCredentailSearch(f.value || '');
          return normUrl.includes(normSite) || normSite.includes(normUrl);
        }
        return false;
      });
    });
  }, [siteKey, allCredentials]);

  const closePicker = async (isCancelled = true) => {
    'worklet';
    runOnJS(logger.info)(`[PICKER] Closing (cancelled=${isCancelled})`);
    if (isCancelled) {
      runOnJS(PasswordManager.cancelAutofill)();
    }
    opacity.value = withTiming(0, { duration: 250 });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: 300, easing: Easing.bezier(0.33, 1, 0.68, 1) },
      () => {
        runOnJS(onClose)();
      },
    );
  };

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150 || event.velocityY > 600) {
        closePicker(true);
      } else {
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.out(Easing.quad),
        });
      }
    });

  useEffect(() => {
    Keyboard.dismiss();
    opacity.value = withTiming(1, { duration: 350 });
    translateY.value = withTiming(0, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });

    // Trigger the unpaginated fetch on mount
    fetchAllLogins();
  }, [fetchAllLogins]);

  const handleSelect = async (cred: Credential) => {
    logger.info(`[PICKER] Resolving: ${cred.username}`);
    await PasswordManager.resolveAutofill(cred);
    onClose();
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: interpolate(translateY.value, [0, 400], [1, 0.3], Extrapolation.CLAMP),
  }));

  const renderItem = ({ item }: { item: Credential }) => (
    <TouchableOpacity
      className={`mb-4 flex-row items-center rounded-2xl border p-4 ${
        isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'
      }`}
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
        <Ionicons name="person-outline" size={24} color="#10b981" />
      </View>
      <View className="flex-1">
        <Text className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {item.username}
        </Text>
        <Text
          className={`mt-0.5 text-xs font-medium uppercase leading-4 tracking-widest ${
            isDarkMode ? 'text-white/40' : 'text-slate-400'
          }`}
        >
          {siteKey}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward-outline"
        size={20}
        color={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
      />
    </TouchableOpacity>
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => closePicker(true)}>
        <Animated.View className="absolute inset-0 bg-black/60" style={animatedBackdropStyle} />
      </Pressable>

      <GestureDetector gesture={gesture}>
        <Animated.View
          className={`absolute bottom-0 left-0 right-0 max-h-[85%] min-h-[40%] overflow-hidden rounded-t-[32px] border-t ${
            isDarkMode ? 'border-white/10 bg-[#141416]' : 'border-slate-200 bg-white'
          }`}
          style={animatedSheetStyle}
        >
          <AnimatedBlurView
            intensity={isDarkMode ? 65 : 45}
            tint={isDarkMode ? 'dark' : 'light'}
            className="absolute inset-0"
          />

          <View className="items-center px-6 pb-8 pt-3">
            <View
              className={`mb-6 h-1 w-12 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-slate-200'}`}
            />

            <View className="flex-row items-center">
              <Text
                className={`text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              >
                SecureVault&nbsp;<Text className="text-4xl font-bold text-emerald-500">X</Text>
              </Text>
            </View>

            <Text
              className={`mt-3 text-sm font-medium ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}
            >
              Pick a credential for{' '}
              <Text className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                {siteKey}
              </Text>
            </Text>
          </View>

          <FlatList
            data={matchedCredentials}
            refreshControl={
              <RefreshControl
                refreshing={isSyncing || isLoadingAll}
                onRefresh={() => {
                  sync();
                  fetchAllLogins();
                }}
                tintColor="#10b981"
              />
            }
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="items-center py-24">
                {isLoadingAll ? (
                  <ActivityIndicator size="large" color="#10b981" />
                ) : (
                  <>
                    <View
                      className={`mb-5 h-20 w-20 items-center justify-center rounded-full border ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <Ionicons
                        name="search-outline"
                        size={36}
                        color={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
                      />
                    </View>
                    <Text
                      className={`text-center text-lg font-bold ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}
                    >
                      No matches found
                    </Text>
                    <Text
                      className={`mt-2 px-10 text-center text-sm ${isDarkMode ? 'text-white/20' : 'text-slate-300'}`}
                    >
                      We couldn't find any credentials for {siteKey} in your vault.
                    </Text>
                  </>
                )}
              </View>
            }
          />

          <TouchableOpacity
            className={`mx-6 mb-12 items-center rounded-3xl border py-4 active:bg-white/10 ${isDarkMode ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}
            onPress={() => closePicker(true)}
          >
            <Text
              className={`text-xs font-black uppercase tracking-[3px] ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}
            >
              Dismiss
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
