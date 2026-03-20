export type SecretType =
  | "login"
  | "card"
  | "api_key"
  | "server"
  | "database"
  | "crypto"
  | "identity"
  | "secure_note"
  | "license"
  | "custom";

export type FieldType =
  | "text"
  | "password"
  | "multiline"
  | "url"
  | "date"
  | "number";

export interface SecretField {
  id: string;
  label: string;
  value: string;
  type: FieldType;

  // UI behavior
  masked?: boolean; // hide like password
  copyable?: boolean; // show copy button
}

export interface SecretMeta {
  tags?: string[];
  environment?: "dev" | "staging" | "prod";
  expiresAt?: number; // timestamp
  createdAt: number;
  updatedAt: number;
}

export interface Secret {
  id: string;
  title: string;
  type: SecretType;

  fields: SecretField[];

  note?: string;

  meta: SecretMeta;
}

export interface SecretTemplate {
  type: SecretType;
  label: string;
  fields: Omit<SecretField, "id" | "value">[];
}
