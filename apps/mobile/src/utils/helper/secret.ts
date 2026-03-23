import { generatePassword } from '@securevault/utils';
import { SecretTemplate, SecretField } from '@securevault/types';
import { VaultSecretT } from '@src/types/vault';

export type MutationMode = 'create' | 'edit';

/**
 * Generates default values for the secret form based on the template and mode.
 * Handles re-hydration for edit mode and legacy structure mapping.
 */
export function getSecretDefaults(
  template: SecretTemplate,
  mode: MutationMode = 'create',
  initialValues?: Partial<VaultSecretT>,
) {
  if (mode === 'edit' && initialValues) {
    // Re-hydrate from dynamic Secret object OR legacy Password/Card structure
    const values: Record<string, string> = {
      title: initialValues.title || '',
    };

    if (initialValues.fields && Array.isArray(initialValues.fields)) {
      initialValues.fields.forEach((f: SecretField) => {
        values[f.label] = f.value;
      });
    }

    values['note'] = initialValues.note || '';
    return values;
  }

  // Default values for new secret
  const defaults: Record<string, string> = { title: '' };
  template.fields.forEach((f) => {
    const label = f.label.toLowerCase();
    if (label.includes('password')) {
      defaults[f.label] = generatePassword(32);
    } else if (label.includes('url') || label.includes('website')) {
      defaults[f.label] = 'https://';
    } else {
      defaults[f.label] = '';
    }
  });
  defaults['note'] = '';
  return defaults;
}
