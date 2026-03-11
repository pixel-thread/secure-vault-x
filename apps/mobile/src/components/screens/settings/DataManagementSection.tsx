import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useCallback } from 'react';
import { toast } from 'sonner-native';
import { http, logger } from '@securevault/utils-native';
import { VAULT_ENDPOINT } from '@securevault/constants';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { decryptData } from '@securevault/crypto';

export default function DataManagementSection() {
  const { colorScheme } = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const handleExportVault = useCallback(async () => {
    try {
      const response = await http.get<any[]>(VAULT_ENDPOINT.GET_VAULT);
      const entries = response?.data ?? [];

      if (!Array.isArray(entries) || entries.length === 0) {
        toast.error('Vault is empty — nothing to export');
        return;
      }

      const mek = await SecureStore.getItemAsync('SV_MEK');
      if (!mek) {
        toast.error('MEK not found — cannot decrypt vault');
        return;
      }

      const decrypted: any[] = [];
      for (const entry of entries) {
        if (!entry.encryptedData || !entry.iv) continue;
        try {
          const payload = await decryptData<any>(entry.encryptedData, entry.iv, mek);
          decrypted.push(payload);
        } catch {
          logger.error('Skipped undecryptable entry during export');
        }
      }

      if (decrypted.length === 0) {
        toast.error('No entries could be decrypted');
        return;
      }

      const json = JSON.stringify(decrypted, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFile = new File(Paths.document, `securevault-export-${timestamp}.json`);
      exportFile.create();
      exportFile.write(json);

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Vault',
        });
      } else {
        toast.success(`Exported to ${exportFile.uri}`);
      }
    } catch (err) {
      logger.error('Export vault failed', err);
      toast.error('Failed to export vault');
    }
  }, []);

  return (
    <>
      <Text className="mb-3 ml-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
        Data Management
      </Text>
      <View className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <TouchableOpacity
          className="flex-row items-center p-5 active:bg-zinc-200 dark:active:bg-zinc-800/60"
          onPress={handleExportVault}>
          <View className="mr-4 h-10 w-10 items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-800/80">
            <Ionicons
              name="download-outline"
              size={22}
              color={isDarkMode ? '#10b981' : '#059669'}
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">Export Vault</Text>
            <Text className="text-sm text-zinc-500 dark:text-zinc-400">
              Download decrypted JSON
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#71717a" />
        </TouchableOpacity>
      </View>
    </>
  );
}
