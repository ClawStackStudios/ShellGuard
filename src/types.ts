export type VaultItemType = "password" | "note" | "totp" | "key" | "attachment";

export type CustomFieldType = "text" | "hidden" | "checkbox" | "linked";
export type CustomFieldLinkedProperty = "username" | "password" | "url" | "notes" | "totp";

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  /** 
   * For text/hidden: the field value.
   * For checkbox: "true" or "false".
   * For linked: resolved at render time, stored as empty string or source property name.
   */
  value: string;
  linkedProperty?: CustomFieldLinkedProperty;
}

export interface Tag {
  name: string;
  color?: string;
}

export interface PasswordHistoryEntry {
  password: string;
  generatedAt: string;
}

export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  secret: string; // Decrypted password in memory / encrypted in DB
  username?: string;
  url?: string;
  uris?: string; // JSON string of additional URLs (string[])
  category?: string;
  tags?: string; // JSON string of tags (string[] or Tag[])
  notes?: string;
  totp_secret?: string; // encrypted
  password_history?: string; // JSON string of PasswordHistoryEntry[]
  attachments?: string; // JSON string of attachments
  custom_fields?: string; // ShellCrypted CustomField[] JSON (server) / decrypted JSON string (client)
  // Present on attachment-type items (from vault_secure_attachments rows)
  file_name?: string;
  mime_type?: string;
  created_at: string;
}


export interface SecureNote {
  id: string;
  title: string;
  content: string; // encrypted
  category?: string;
  tags?: string; // JSON string of tags
  custom_fields?: string; // ShellCrypted CustomField[] JSON (server) / decrypted JSON string (client)
  created_at: string;
}

export interface SshKey {
  id: string;
  title: string;
  key_value: string; // encrypted
  username?: string;
  category?: string;
  tags?: string; // JSON string of tags
  custom_fields?: string; // ShellCrypted CustomField[] JSON (server) / decrypted JSON string (client)
  created_at: string;
}

export interface SecureAttachment {
  id: string;
  title: string;
  file_data: string; // encrypted
  file_name?: string;
  mime_type?: string;
  category?: string;
  created_at: string;
}

export interface Agent {
  id: string;
  name: string;
  apiKey: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
}

export interface Lobster {
  uuid: string;
  username: string;
  displayName?: string;
}
