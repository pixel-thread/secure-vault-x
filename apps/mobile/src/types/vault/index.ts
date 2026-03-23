import { Secret, SecretType as NewSecretType } from '@securevault/types';

export type SecretType = NewSecretType;

export type VaultSecretT = Secret;

export type EncryptedVaultT = {
  id?: string;
  encryptedData: string;
  iv: string;
  version: number;
};

export type VaultContextT = {
  isLoading: {
    isPending: boolean;
    isSaving: boolean;
    isFetching: boolean;
    isDeleting: boolean;
    isSyncing: boolean;
  };

  sync: () => Promise<void>;

  addVaultItem: (item: EncryptedVaultT) => Promise<void>;

  updateVaultItem: (item: EncryptedVaultT) => Promise<void>;

  deleteVaultItem: (id: string) => Promise<void>;

  getVaultItems: (params?: { limit?: number; offset?: number }) => Promise<VaultSecretT[]>;

  getVaultItem: (id: string) => Promise<VaultSecretT | null>;

  vaultItems: VaultSecretT[]; // Expose the reactive items list

  isVaultReady: boolean;

  fetchNextPage: () => void;

  hasNextPage: boolean;

  isFetchingNextPage: boolean;
};
