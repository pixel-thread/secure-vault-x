type SecretType = 'password' | 'card';

interface BaseSecret {
  id: string;
  type: SecretType;
  serviceName: string;
  note?: string;
}

interface PasswordSecret extends BaseSecret {
  type: 'password';
  website: string;
  username: string;
  secretInfo: string;
}

interface CardSecret extends BaseSecret {
  type: 'card';
  cardholderName: string;
  cardNumber: string;
  expirationDate: string;
  cvv: string;
}

export type VaultSecretT = PasswordSecret | CardSecret;

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
  getVaultItems: () => Promise<VaultSecretT[]>;
  getVaultItem: (id: string) => Promise<VaultSecretT | null>;
  vaultItems: VaultSecretT[]; // Expose the reactive items list
};
