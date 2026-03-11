import { useState } from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VaultSecretT } from '@/src/types/vault';
import { logger } from '@securevault/utils';

export const VaultItemIcon = ({ item }: { item: VaultSecretT }) => {
  const [imgError, setImgError] = useState(false);

  const renderIcon = () => {
    if (item.type === 'password' && item.website && !imgError) {
      let domain = item.website;
      try {
        domain = new URL(item.website).hostname;
      } catch (e) {
        logger.error('Failed to parse URL', e);
        domain = item.website;
        // Fallback if not a strict URL format
      }
      return (
        <Image
          source={{ uri: `https://www.google.com/s2/favicons?domain=${domain}&sz=64` }}
          style={{ width: 24, height: 24, borderRadius: 4 }}
          onError={() => setImgError(true)}
        />
      );
    }
    return (
      <Ionicons
        name={item.type === 'password' ? 'key' : 'card-outline'}
        size={24}
        color="#10b981"
      />
    );
  };

  return (
    <View className="mr-5 h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
      {renderIcon()}
    </View>
  );
};
