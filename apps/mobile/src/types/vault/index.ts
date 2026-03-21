import { Secret, SecretType as NewSecretType } from '@securevault/types';

export type SecretType = NewSecretType;

type SecretMetaT = {
  tags: string[];
  environment: 'dev' | 'staging' | 'prod';
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
};

interface BaseSecret {
  id: string;
  type: SecretType;
  serviceName: string;
  note?: string;
  meta: SecretMetaT;
}

export interface PasswordSecret extends BaseSecret {
  type: 'login';
  website: string;
  username: string;
  secretInfo: string;
}

export interface CardSecret extends BaseSecret {
  type: 'card';
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

export type VaultSecretT = PasswordSecret | CardSecret | Secret;

export type VaultContextT = {
  isLoading: {
    isPending: boolean;
    isSaving: boolean;
    isFetching: boolean;
    isDeleting: boolean;
    isSyncing: boolean;
  };
  sync: () => Promise<void>;
  addVaultItem: (item: { id: string; encryptedData: string; iv: string }) => Promise<void>;
  updateVaultItem: (item: { id: string; encryptedData: string; iv: string }) => Promise<void>;
  deleteVaultItem: (id: string) => Promise<void>;
  getVaultItems: (params?: { limit?: number; offset?: number }) => Promise<VaultSecretT[]>;
  getVaultItem: (id: string) => Promise<VaultSecretT | null>;
  vaultItems: VaultSecretT[]; // Expose the reactive items list
  isVaultReady: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};
