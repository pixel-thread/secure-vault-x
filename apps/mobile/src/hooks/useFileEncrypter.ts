import { encryptData } from '@securevault/crypto';
import { logger } from '@securevault/utils-native';
import { DeviceStoreManager } from '@store/device';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState, useCallback, useEffect } from 'react';
import { MAX_FILE_SIZE_BYTES } from '@securevault/constants';
import { toast } from 'sonner-native';

export type FileMetadata = {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
};

/**
 * ============================================================================
 * USE FILE ENCRYPTER HOOK
 * ============================================================================
 * Centralized hook for processing, encrypting, and decrypting files in a 
 * zero-knowledge environment.
 * 
 * Features:
 * 1. Sandboxed picking via DocumentPicker
 * 2. Secure Base64 reading and AES-256-GCM preparation
 * 3. Ephemeral decryption to internal cache
 * 4. Automatic cleanup of decrypted files on unmount
 */
export function useFileEncrypter() {
  const [fileInfo, setFileInfo] = useState<FileMetadata | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tempUri, setTempUri] = useState<string | null>(null);

  /**
   * --- SECURE CLEANUP ---
   * Automatically wipes any temporary decrypted file from the internal cache
   * when the component unmounts or the tempUri changes.
   */
  useEffect(() => {
    return () => {
      if (tempUri) {
        const file = new File(tempUri);
        if (file.exists) {
          try {
            file.delete();
            logger.info('[useFileEncrypter] Securely wiped temporary file', { uri: tempUri });
          } catch (err) {
            logger.error('[useFileEncrypter] Cleanup failed', { error: err });
          }
        }
      }
    };
  }, [tempUri]);

  /**
   * Opens the native document picker and performs size validation.
   */
  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;

      const file = result.assets[0];
      
      // Enforce zero-knowledge friendly size limits
      if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
        toast.error('File too large', { description: `Files must be under 5MB.` });
        return null;
      }

      const info: FileMetadata = {
        uri: file.uri,
        name: file.name,
        size: file.size || 0,
        mimeType: file.mimeType || 'application/octet-stream',
      };
      
      setFileInfo(info);
      return info;
    } catch (err) {
      logger.error('[useFileEncrypter] Picker failed', { error: err });
      toast.error('Could not access files');
      return null;
    }
  }, []);

  /**
   * Reads a local file as Base64, generates metadata, and encrypts the entire payload.
   */
  const prepareEncryptionPayload = useCallback(async (title: string, metadata: FileMetadata) => {
    setIsProcessing(true);
    try {
      const mek = await DeviceStoreManager.getMek();
      if (!mek) {
        toast.error('Vault locked', { description: 'Encryption key not found.' });
        return null;
      }

      // Read from the persistent URI provided by the picker
      const pickedFile = new File(metadata.uri);
      const base64Data = await pickedFile.base64();

      const secretPayload = {
        id: Crypto.randomUUID(),
        title: title || metadata.name,
        type: 'file',
        fields: [
          { id: Crypto.randomUUID(), label: 'fileName', value: metadata.name, type: 'text' },
          { id: Crypto.randomUUID(), label: 'fileSize', value: String(metadata.size), type: 'number' },
          { id: Crypto.randomUUID(), label: 'contentType', value: metadata.mimeType, type: 'text' },
          { id: Crypto.randomUUID(), label: 'base64Data', value: base64Data, type: 'text', masked: true },
        ],
        meta: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };

      // AES-256-GCM encryption with master key
      const { encryptedData, iv } = await encryptData(secretPayload, mek);
      
      // Instant cleanup of the unencrypted picker cache
      if (pickedFile.exists) {
        pickedFile.delete();
      }

      return { id: secretPayload.id, encryptedData, iv };
    } catch (err: any) {
      // Security: Obscure the error message to ensure no part of the Base64 payload is logged
      logger.error('[useFileEncrypter] Encryption failed', { message: err?.message || 'Unknown error' });
      toast.error('Failed to secure file');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Writes encrypted Base64 data back to a temporary file in the cache directory 
   * and opens the native sharing sheet.
   */
  const decryptAndOpen = useCallback(async (fileName: string, contentType: string, encryptedBase64Payload: string) => {
    setIsProcessing(true);
    try {
      // Create a temporary file in the isolated app cache
      const tempFile = new File(Paths.cache, fileName);
      tempFile.create({ overwrite: true });
      tempFile.write(encryptedBase64Payload, { encoding: 'base64' });

      setTempUri(tempFile.uri);

      // Trigger native document viewer/sharer
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(tempFile.uri, {
          mimeType: contentType,
          dialogTitle: `Viewing ${fileName}`,
          UTI: contentType,
        });
      } else {
        toast.error("Viewer unavailable", { description: "Format not supported by installed apps." });
      }
    } catch (err: any) {
      // Security: Obscure the error message to ensure no part of the payload is logged
      logger.error('[useFileEncrypter] Decryption/Sharing failed', { message: err?.message || 'Unknown error' });
      toast.error('Failed to open file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    fileInfo,
    isProcessing,
    pickFile,
    prepareEncryptionPayload,
    decryptAndOpen,
    clearSelection: () => setFileInfo(null),
  };
}
