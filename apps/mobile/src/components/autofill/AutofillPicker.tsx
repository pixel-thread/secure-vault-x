import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import { PasswordManager, Credential } from '@utils/PasswordManager';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl } from 'react-native-gesture-handler';
import { useVaultContext } from '@src/hooks/vault/useVaultContext';
import { logger } from '@securevault/utils-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AutofillPickerProps {
  siteKey: string | null;
  onClose: () => void;
}

/**
 * Normalizes a URL or site key for fuzzy matching, mirroring the native implementation.
 */
const normalize = (raw: string) => {
  if (!raw) return '';
  let s = raw.toLowerCase().trim();
  s = s.replace(/^https?:\/\//, '').split('/')[0];
  const common = ['com.', '.android', '.com', '.net', '.org', '.co.uk', 'www.'];
  common.forEach((it) => {
    s = s.replace(it, '');
  });
  return s.replace(/[^a-z0-9]/g, '');
};

export const AutofillPicker: React.FC<AutofillPickerProps> = ({ siteKey, onClose }) => {
  const [slideAnim] = useState(new Animated.Value(SCREEN_HEIGHT));
  const [opacityAnim] = useState(new Animated.Value(0));

  const {
    vaultItems,
    sync,
    isLoading: { isSyncing },
  } = useVaultContext();

  /**
   * Fuzzy-match vault items against the current siteKey in JavaScript.
   * This replaces the need for native side syncing/matching.
   */
  const matchedCredentials = useMemo(() => {
    if (!siteKey || !vaultItems) return [];

    const normSite = normalize(siteKey);
    logger.info(`[PICKER] Filtering for normSite: ${normSite}`);

    return vaultItems
      .filter((item) => item.type === 'login')
      .filter((item) => {
        // Match against title
        const normTitle = normalize(item.title || '');
        if (normTitle.includes(normSite) || normSite.includes(normTitle)) return true;

        // Match against any URL/website fields
        return item.fields.some((f) => {
          if (f.type === 'url' || f.label.toLowerCase() === 'website') {
            const normUrl = normalize(f.value || '');
            return normUrl.includes(normSite) || normSite.includes(normUrl);
          }
          return false;
        });
      })
      .map((item) => {
        // Transform VaultItem to a Credential object for resolution
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
        } as Credential;
      });
  }, [siteKey, vaultItems]);

  useEffect(() => {
    Keyboard.dismiss();

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  const handleSelect = async (cred: Credential) => {
    logger.info(`[PICKER] Resolving autofill for: ${cred.username}`);
    await PasswordManager.resolveAutofill(cred);
    onClose();
  };

  const handleCancel = async () => {
    logger.info('[PICKER] Cancelling autofill');
    await PasswordManager.cancelAutofill();
    onClose();
  };

  const renderItem = ({ item }: { item: Credential }) => (
    <TouchableOpacity
      className="mb-3 flex-row items-center rounded-2xl border border-white/10 bg-white/5 p-4"
      onPress={() => handleSelect(item)}
      activeOpacity={0.7}
    >
      <View className="mr-4 h-11 w-11 items-center justify-center rounded-xl bg-blue-500">
        <Ionicons name="person-outline" size={24} color="#FFF" />
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-white">{item.username}</Text>
        <Text className="mt-0.5 text-xs text-white/40">{siteKey}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );

  return (
    <Animated.View style={{ opacity: opacityAnim }} className="absolute inset-0 justify-end">
      <Animated.View
        style={{ transform: [{ translateY: slideAnim }] }}
        className="max-h-[80%] rounded-t-3xl border border-white/10 bg-[#1c1c1c] pb-10"
      >
        <View className="items-center py-5">
          <View className="mb-4 h-[5px] w-10 rounded bg-white/20 dark:bg-white/10" />

          <Text className="text-4xl font-extrabold tracking-tighter text-white dark:text-white">
            SecureVault <Text className="text-emerald-500">X</Text>
          </Text>

          <Text className="mt-1 text-sm text-white/50">Autofilling for {siteKey}</Text>
        </View>

        <FlatList
          data={matchedCredentials}
          refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={() => sync()} />}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View className="items-center p-10">
              <Ionicons name="search-outline" size={48} color="rgba(255,255,255,0.1)" />
              <Text className="mt-4 text-center text-white/30">
                No credentials found for this site.{'\n'}Pull down to sync or search manualy.
              </Text>
            </View>
          }
        />

        <TouchableOpacity className="mt-2 items-center p-4" onPress={handleCancel}>
          <Text className="text-base font-semibold text-blue-500">Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};
