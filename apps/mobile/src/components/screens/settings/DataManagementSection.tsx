import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useCallback } from 'react';
import { toast } from 'sonner-native';
import { logger } from '@securevault/utils-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useVaultContext } from '@src/hooks/vault/useVaultContext';
import { isBiometricAvailable, authenticateWithBiometric } from '@utils/biometricLock';
import { useNotification } from '@hooks/useNotification';
import { scheduleTestNotifications } from '@src/utils/vault/dev';

export default function DataManagementSection() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { vaultItems } = useVaultContext();
  const { scheduleTest } = useNotification();

  const handleExportVault = useCallback(async () => {
    try {
      const isEnabledBiometric = await isBiometricAvailable();

      if (isEnabledBiometric) {
        const success = await authenticateWithBiometric();
        if (!success) {
          toast.error('Vibe check failed', { description: 'Biometrics required.' });
          return;
        }
      }

      const header = 'Service Name, Username, Password, Website, Notes\n';

      if (vaultItems.length === 0) {
        toast.error('Vault is empty... lonely vibes.');
        return;
      }

      logger.info('Exporting vault', {
        data: vaultItems.length,
      });

      const rows = vaultItems
        .map((item) => {
          const u = item.fields?.find((f) => f.label.toLowerCase().includes('user'))?.value || '';
          const p =
            item.fields?.find(
              (f) =>
                f.label.toLowerCase().includes('password') ||
                f.label.toLowerCase().includes('card') ||
                f.label.toLowerCase().includes('cvv'),
            )?.value || '';
          const w =
            item.fields?.find(
              (f) =>
                f.label.toLowerCase().includes('url') || f.label.toLowerCase().includes('website'),
            )?.value || '';
          return `${item.title || ''},${u},${p}, ${w},${item.note || ''}`;
        })
        .join('\n');

      const csv = `${header}${rows}`;

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = new File(Paths.document, `securevault-export-${timestamp}.csv`);
      exportFile.create();
      exportFile.write(csv);

      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: 'application/csv',
          dialogTitle: 'Export Vault',
        });
      } else {
        toast.success(`Exported to ${exportFile.uri}`);
      }

      logger.info('Vault exported successfully', {
        timeStamp: Date.now(),
      });
      return;
    } catch (err) {
      logger.error('Export vault failed', err);
      toast.error('Failed to export vault');
    }
  }, [vaultItems]);

  return (
    <>
      <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Data Management
      </Text>
      <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <TouchableOpacity
          className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
          onPress={handleExportVault}
        >
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
            <Ionicons
              name="download-outline"
              size={22}
              color={isDarkMode ? '#10b981' : '#059669'}
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Export Vault</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">Download decrypted CSV</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <>
          <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Developer Tools
          </Text>
          <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <TouchableOpacity
              className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
              onPress={async () => {
                await scheduleTestNotifications(vaultItems, scheduleTest);
                toast.success('Alerts queued... testing the vibe.');
              }}
            >
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <Ionicons name="flask-outline" size={22} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-zinc-900 dark:text-white">
                  Schedule Test Alerts
                </Text>
                <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                  Fire alerts for all types (+1m each)
                </Text>
              </View>
              <Ionicons name="notifications-outline" size={20} color="#71717a" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );
}
