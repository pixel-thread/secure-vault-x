export type VaultT = {
  id: string;
  type: 'password' | 'bank-card';
  serviceName: string;
  username: string;
  secretInfo: string;
  cardNumber: string;
  exp: string;
  cvv: string;
  note: string;
};

export type SecretType = 'password' | 'card';

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

