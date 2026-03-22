import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type UrgencyLevel = 'normal' | 'soon' | 'urgent' | 'overdue';

const getBadgeConfig = (urgency: UrgencyLevel, diffDays: number) =>
  ({
    normal: {
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      icon: 'time-outline' as const,
      label: diffDays > 30 ? 'Healthy' : `${diffDays} days left`,
    },
    soon: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'alert-circle-outline' as const,
      label: `${diffDays} days left`,
    },
    urgent: {
      bg: 'bg-orange-50 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      icon: 'warning-outline' as const,
      label: 'Update Soon',
    },
    overdue: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'skull-outline' as const,
      label: 'Action Required',
    },
  })[urgency];

interface UrgencyBadgeProps {
  expiresAt?: number;
  nextRotationAt?: number;
}

export const UrgencyBadge = ({ expiresAt, nextRotationAt }: UrgencyBadgeProps) => {
  const targetDate = nextRotationAt || expiresAt;
  if (!targetDate) return null;

  const now = Date.now();
  const diffDays = Math.ceil((targetDate - now) / 86400000);

  const urgency = useMemo<UrgencyLevel>(() => {
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'urgent';
    if (diffDays <= 7) return 'soon';
    return 'normal';
  }, [diffDays]);
  const config = useMemo(() => getBadgeConfig(urgency, diffDays), [urgency, diffDays]);

  return (
    <View className={`flex-row items-center rounded-full px-2.5 py-1 ${config.bg}`}>
      <Ionicons
        name={config.icon}
        size={14}
        color={
          config.text.includes('red')
            ? '#ef4444'
            : config.text.includes('orange')
              ? '#f97316'
              : config.text.includes('blue')
                ? '#3b82f6'
                : '#71717a'
        }
      />
      <Text className={`ml-1 text-xs font-semibold ${config.text}`}>{config.label}</Text>
    </View>
  );
};
