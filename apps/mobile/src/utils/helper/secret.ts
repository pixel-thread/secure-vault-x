import { generatePassword } from '@securevault/utils';
import { SecretTemplate, SecretField } from '@securevault/types';

export type MutationMode = 'create' | 'edit';

/**
 * Generates default values for the secret form based on the template and mode.
 * Handles re-hydration for edit mode and legacy structure mapping.
 */
export function getSecretDefaults(
  template: SecretTemplate,
  mode: MutationMode = 'create',
  initialValues?: any
) {
  if (mode === 'edit' && initialValues) {
    // Re-hydrate from dynamic Secret object OR legacy Password/Card structure
    const values: Record<string, string> = {
      title: initialValues.title || initialValues.serviceName || '',
    };

    if (initialValues.fields && Array.isArray(initialValues.fields)) {
      // Dynamic fields path
      initialValues.fields.forEach((f: SecretField) => {
        values[f.label] = f.value;
      });
    } else {
      // legacy-to-dynamic mapping path
      if (initialValues.type === 'password') {
        values['Username'] = initialValues.username || '';
        values['Password'] = initialValues.secretInfo || '';
        values['Website URL'] = initialValues.website || 'https://';
      } else if (initialValues.type === 'card') {
        values['Cardholder Name'] = initialValues.cardholderName || '';
        values['Card Number'] = initialValues.cardNumber || '';
        values['Expiry Date'] = initialValues.expirationDate || '';
        values['CVV'] = initialValues.cvv || '';
      }
    }

    values['note'] = initialValues.note || '';
    return values;
  }

  // Default values for new secret
  const defaults: Record<string, string> = { title: '' };
  template.fields.forEach((f) => {
    defaults[f.label] = '';
    if (f.label.toLowerCase().includes('password')) {
      defaults[f.label] = generatePassword(32);
    }
  });
  defaults['note'] = '';
  return defaults;
}
