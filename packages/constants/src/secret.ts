import { SecretTemplate } from '@securevault/types';

export const SECRET_TEMPLATES: SecretTemplate[] = [
  {
    type: 'login',
    label: 'Login',
    fields: [
      { label: 'Username', type: 'text' },
      { label: 'Password', type: 'password', masked: true, copyable: true },
      { label: 'Website URL', type: 'url' },
    ],
  },
  {
    type: 'card',
    label: 'Credit Card',
    fields: [
      { label: 'Cardholder Name', type: 'text' },
      { label: 'Card Number', type: 'password', masked: true, copyable: true },
      { label: 'Expiry Date', type: 'text' },
      { label: 'CVV', type: 'password', masked: true },
    ],
  },
  {
    type: 'api_key',
    label: 'API Key',
    fields: [
      { label: 'Service Name', type: 'text' },
      { label: 'API Key', type: 'password', masked: true, copyable: true },
      { label: 'Base URL', type: 'url' },
    ],
  },
  {
    type: 'database',
    label: 'Database',
    fields: [
      { label: 'DB Name', type: 'text' },
      { label: 'Connection URL', type: 'password', masked: true },
      { label: 'Username', type: 'text' },
      { label: 'Password', type: 'password', masked: true },
    ],
  },
  {
    type: 'crypto',
    label: 'Crypto Wallet',
    fields: [
      { label: 'Wallet Name', type: 'text' },
      { label: 'Address', type: 'text' },
      { label: 'Seed Phrase', type: 'multiline', masked: true },
    ],
  },
  {
    type: 'identity',
    label: 'Identity',
    fields: [
      { label: 'Document Type', type: 'text' },
      { label: 'ID Number', type: 'text' },
      { label: 'Expiry Date', type: 'date' },
    ],
  },
  {
    type: 'secure_note',
    label: 'Secure Note',
    fields: [
      { label: 'Title', type: 'text' },
      { label: 'Content', type: 'multiline', masked: true },
    ],
  },
];
