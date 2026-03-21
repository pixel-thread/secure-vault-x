import { SecretType } from '@securevault/types';

export function getIcon(type: SecretType) {
  switch (type) {
    case 'login':
      return 'person';
    case 'card':
      return 'card';
    case 'crypto':
      return 'logo-bitcoin';
    case 'api_key':
      return 'key';
    case 'database':
      return 'server';
    case 'identity':
      return 'person';
    case 'secure_note':
      return 'document-text';
    case 'file':
      return 'document';
    default:
      return 'document-text';
  }
}
