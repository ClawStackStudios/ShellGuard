export type VaultItemType = "password" | "note" | "totp" | "key" | "attachment";

export interface VaultItem {
  id: string;
  type: VaultItemType;
  title: string;
  secret: string; // Decrypted password in memory / encrypted in DB
  username?: string;
  url?: string;
  category?: string;
  notes?: string;
  totp_secret?: string; // encrypted
  attachments?: string; // JSON string of attachments
  created_at: string;
}

export interface SecureNote {
  id: string;
  title: string;
  content: string; // encrypted
  category?: string;
  created_at: string;
}

export interface SshKey {
  id: string;
  title: string;
  key_value: string; // encrypted
  username?: string;
  category?: string;
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
