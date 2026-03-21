import { useState } from 'react';
import { Image, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VaultSecretT } from '@src/types/vault';
import { SecretType } from '@securevault/types';
import { getIcon } from '@src/utils/helper/getIcon';

export const VaultItemIcon = ({ item }: { item: VaultSecretT }) => {
  const [imgError, setImgError] = useState(false);

  if (!item) return null;

  const renderIcon = () => {
    // 1. Try to find a website URL from the fields or a direct property
    const itemAny = item as any;
    const websiteUrl =
      itemAny.website ||
      itemAny.fields?.find(
        (f: any) =>
          f.label.toLowerCase().includes('url') || f.label.toLowerCase().includes('website')
      )?.value;

    if (websiteUrl && !imgError) {
      let domain = websiteUrl;
      try {
        const urlStr = domain.startsWith('http') ? domain : `https://${domain}`;
        domain = new URL(urlStr).hostname;
      } catch (e) {
        domain = websiteUrl; // Fallback if not a strict URL format
      }
      return (
        <Image
          source={{ uri: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` }}
          style={{ width: 24, height: 24, borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      );
    }

    // 2. Fallback to the first letter of the service (item.title)
    const title = itemAny.title || '';
    const firstChar = title.trim().charAt(0);
    if (firstChar && /[a-zA-Z]/.test(firstChar)) {
      return (
        <Text className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {firstChar.toUpperCase()}
        </Text>
      );
    }

    // 3. Ultimate fallback: default icon based on type
    return <Ionicons name={getIcon(item?.type as SecretType)} size={24} color="#10b981" />;
  };

  return (
    <View className="h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
      {renderIcon()}
    </View>
  );
};
