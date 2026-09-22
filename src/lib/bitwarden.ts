// src/lib/bitwarden.ts — Universal Bitwarden JSON & CSV parser & mapper for ShellGuard.
import { VaultItem, VaultItemType, CustomField, PasswordHistoryEntry } from '../types.ts';
import { normalizePod } from './podUtils.ts';
import { serializeSshKeySecret } from './keyGen.ts';
import { parseTotpSecret, formatTotpSecret } from './totpUtils.ts';

export interface BitwardenField {
  type: number; // 0: text, 1: hidden, 2: boolean, 3: linked
  name?: string;
  value?: any;
  linkedId?: number;
}

export interface BitwardenLoginUri {
  match?: number | null;
  uri?: string;
}

export interface BitwardenPasswordHistory {
  lastUsedDate?: string;
  password?: string;
}

export interface BitwardenItem {
  id?: string;
  type: number; // 1: Login, 2: SecureNote, 3: Card, 4: Identity, 5: SshKey
  name: string;
  notes?: string;
  favorite?: boolean;
  folderId?: string | null;
  collectionIds?: string[] | null;
  fields?: BitwardenField[];
  login?: {
    uris?: BitwardenLoginUri[];
    username?: string;
    password?: string;
    totp?: string;
    fido2Credentials?: any[];
  };
  secureNote?: {
    type?: number;
  };
  sshKey?: {
    privateKey?: string;
    publicKey?: string;
    keyFingerprint?: string;
  };
  card?: {
    cardholderName?: string;
    brand?: string;
    number?: string;
    expMonth?: string;
    expYear?: string;
    code?: string;
  };
  identity?: {
    title?: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    address3?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    company?: string;
    email?: string;
    phone?: string;
    ssn?: string;
    username?: string;
    passportNumber?: string;
    licenseNumber?: string;
  };
  passwordHistory?: BitwardenPasswordHistory[];
  creationDate?: string;
  revisionDate?: string;
}

export interface BitwardenFolder {
  id: string;
  name: string;
}

export interface BitwardenExport {
  encrypted?: boolean;
  folders?: BitwardenFolder[];
  items?: BitwardenItem[];
}

function safeGenerateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // Fall through to resilient generator
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Checks if a parsed JSON structure matches Bitwarden export signatures.
 */
export function isBitwardenJson(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  // Standard Bitwarden export object has an items array
  if (Array.isArray(data.items)) {
    // If folders or encrypted flag are present, it's definitely Bitwarden
    if ('encrypted' in data || Array.isArray(data.folders)) {
      return true;
    }
    // Check item structure: Bitwarden items have numeric `type` between 1 and 5
    if (data.items.length > 0) {
      const sample = data.items[0];
      if (sample && typeof sample === 'object' && typeof sample.type === 'number') {
        return sample.type >= 1 && sample.type <= 5;
      }
    }
    return false;
  }
  return false;
}

/**
 * Checks if the Bitwarden export is encrypted (which requires user to export unencrypted).
 */
export function isEncryptedBitwardenExport(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (data.encrypted === true) return true;
  if (Array.isArray(data.items) && data.items.length > 0) {
    const sample = data.items[0];
    if (typeof sample?.name === 'string' && sample.name.startsWith('2.')) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if a CSV text string has Bitwarden header columns.
 */
export function isBitwardenCsv(csvText: string): boolean {
  if (!csvText || typeof csvText !== 'string') return false;
  const firstLine = csvText.trim().split(/\r?\n/)[0]?.toLowerCase() || '';
  return (
    firstLine.includes('folder') &&
    firstLine.includes('type') &&
    firstLine.includes('name') &&
    (firstLine.includes('login_username') || firstLine.includes('login_password'))
  );
}

/**
 * Maps a Bitwarden JSON export structure to ShellGuard VaultItems.
 */
export function mapBitwardenToVaultItems(
  exportData: BitwardenExport,
  generateId: () => string = safeGenerateId
): VaultItem[] {
  if (!exportData || !Array.isArray(exportData.items)) {
    return [];
  }

  // Build folder lookup table: id -> normalized Pod
  const folderMap = new Map<string, string>();
  if (Array.isArray(exportData.folders)) {
    for (const f of exportData.folders) {
      if (f && f.id && f.name) {
        folderMap.set(f.id, normalizePod(f.name));
      }
    }
  }

  const now = new Date().toISOString();
  const results: VaultItem[] = [];

  for (const item of exportData.items) {
    if (!item || typeof item !== 'object') continue;

    const id = generateId();
    const title = (item.name || 'Untitled').trim();
    const folderCategory = item.folderId ? folderMap.get(item.folderId) : undefined;
    const category = folderCategory !== undefined ? folderCategory : '';
    const notes = item.notes || '';
    const createdAt = item.creationDate ? new Date(item.creationDate).toISOString() : now;

    // Convert custom fields
    const customFields: CustomField[] = [];
    if (Array.isArray(item.fields)) {
      for (const field of item.fields) {
        if (!field || !field.name) continue;
        let cfType: CustomField['type'] = 'text';
        let cfValue = String(field.value ?? '');
        if (field.type === 1) {
          cfType = 'hidden';
        } else if (field.type === 2) {
          cfType = 'checkbox';
          cfValue = String(Boolean(field.value));
        } else if (field.type === 3) {
          cfType = 'linked';
          cfValue = '';
        }
        customFields.push({
          id: generateId(),
          name: field.name.trim(),
          type: cfType,
          value: cfValue,
        });
      }
    }

    // Convert password history
    const passwordHistory: PasswordHistoryEntry[] = [];
    if (Array.isArray(item.passwordHistory)) {
      for (const ph of item.passwordHistory) {
        if (ph && ph.password) {
          passwordHistory.push({
            password: ph.password,
            generatedAt: ph.lastUsedDate ? new Date(ph.lastUsedDate).toISOString() : now,
          });
        }
      }
    }

    // Map by item.type (1: Login, 2: Note, 3: Card, 4: Identity, 5: SSH Key)
    switch (item.type) {
      case 1: {
        // Login
        const login = item.login || {};
        const username = login.username || '';
        const secret = login.password || '';
        const uris = Array.isArray(login.uris) ? login.uris.map(u => u?.uri?.trim()).filter(Boolean) as string[] : [];
        const primaryUrl = uris[0] || '';
        const extraUris = uris.length > 1 ? uris.slice(1) : [];

        // Parse TOTP
        let totpSecret = '';
        if (login.totp) {
          const parsedTotp = parseTotpSecret(login.totp);
          if (parsedTotp) {
            totpSecret = formatTotpSecret(parsedTotp, title);
          }
        }

        results.push({
          id,
          type: 'password',
          title,
          secret,
          username,
          url: primaryUrl,
          uris: extraUris.length > 0 ? JSON.stringify(extraUris) : undefined,
          category,
          notes,
          totp_secret: totpSecret || undefined,
          password_history: passwordHistory.length > 0 ? JSON.stringify(passwordHistory) : undefined,
          custom_fields: customFields.length > 0 ? JSON.stringify(customFields) : undefined,
          attachments: '[]',
          tags: item.favorite ? JSON.stringify(['Favorite']) : '[]',
          created_at: createdAt,
        });
        break;
      }

      case 2: {
        // Secure Note
        results.push({
          id,
          type: 'note',
          title,
          secret: notes, // For secure notes, secret holds the note body
          notes,
          category,
          custom_fields: customFields.length > 0 ? JSON.stringify(customFields) : undefined,
          attachments: '[]',
          tags: item.favorite ? JSON.stringify(['Favorite']) : '[]',
          created_at: createdAt,
        });
        break;
      }

      case 5: {
        // SSH Key
        const privKey = item.sshKey?.privateKey || '';
        const pubKey = item.sshKey?.publicKey || '';
        const compoundSecret = serializeSshKeySecret(privKey, pubKey);

        results.push({
          id,
          type: 'key',
          title,
          secret: compoundSecret,
          username: item.sshKey?.keyFingerprint || '',
          category,
          notes,
          custom_fields: customFields.length > 0 ? JSON.stringify(customFields) : undefined,
          attachments: '[]',
          tags: item.favorite ? JSON.stringify(['Favorite']) : '[]',
          created_at: createdAt,
        });
        break;
      }

      case 3: {
        // Credit Card -> Map to password-type item with cardholder as username, number as secret
        const card = item.card || {};
        const cardFields: CustomField[] = [...customFields];
        if (card.brand) cardFields.push({ id: generateId(), name: 'Card Brand', type: 'text', value: card.brand });
        if (card.expMonth && card.expYear) cardFields.push({ id: generateId(), name: 'Expiration', type: 'text', value: `${card.expMonth}/${card.expYear}` });
        if (card.code) cardFields.push({ id: generateId(), name: 'Security Code (CVV)', type: 'hidden', value: card.code });

        results.push({
          id,
          type: 'password',
          title,
          username: card.cardholderName || '',
          secret: card.number || '',
          category,
          notes,
          custom_fields: cardFields.length > 0 ? JSON.stringify(cardFields) : undefined,
          attachments: '[]',
          tags: item.favorite ? JSON.stringify(['Favorite']) : '[]',
          created_at: createdAt,
        });
        break;
      }

      case 4: {
        // Identity -> Map to note-type item with address & personal fields in customFields
        const iden = item.identity || {};
        const idenFields: CustomField[] = [...customFields];
        if (iden.title) idenFields.push({ id: generateId(), name: 'Title', type: 'text', value: iden.title });
        const fullName = [iden.firstName, iden.middleName, iden.lastName].filter(Boolean).join(' ');
        if (fullName) idenFields.push({ id: generateId(), name: 'Full Name', type: 'text', value: fullName });
        if (iden.company) idenFields.push({ id: generateId(), name: 'Company', type: 'text', value: iden.company });
        if (iden.email) idenFields.push({ id: generateId(), name: 'Email', type: 'text', value: iden.email });
        if (iden.phone) idenFields.push({ id: generateId(), name: 'Phone', type: 'text', value: iden.phone });
        if (iden.address1) idenFields.push({ id: generateId(), name: 'Address 1', type: 'text', value: iden.address1 });
        if (iden.city || iden.state || iden.postalCode) {
          const loc = [iden.city, iden.state, iden.postalCode, iden.country].filter(Boolean).join(', ');
          idenFields.push({ id: generateId(), name: 'Location', type: 'text', value: loc });
        }
        if (iden.ssn) idenFields.push({ id: generateId(), name: 'SSN', type: 'hidden', value: iden.ssn });
        if (iden.passportNumber) idenFields.push({ id: generateId(), name: 'Passport Number', type: 'hidden', value: iden.passportNumber });
        if (iden.licenseNumber) idenFields.push({ id: generateId(), name: 'License Number', type: 'hidden', value: iden.licenseNumber });

        results.push({
          id,
          type: 'note',
          title,
          secret: notes,
          notes,
          category,
          custom_fields: idenFields.length > 0 ? JSON.stringify(idenFields) : undefined,
          attachments: '[]',
          tags: item.favorite ? JSON.stringify(['Favorite']) : '[]',
          created_at: createdAt,
        });
        break;
      }

      default: {
        // Fallback for unrecognized types: map as password item
        results.push({
          id,
          type: 'password',
          title,
          secret: item.notes || '',
          category,
          notes,
          attachments: '[]',
          tags: '[]',
          created_at: createdAt,
        });
        break;
      }
    }
  }

  return results;
}

/**
 * Simple robust CSV row parser respecting RFC 4180 escaped quotes.
 */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentVal);
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++; // CRLF
      currentRow.push(currentVal);
      if (currentRow.some(c => c.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || currentRow.length > 0) {
    currentRow.push(currentVal);
    if (currentRow.some(c => c.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Parses Bitwarden CSV export text into ShellGuard VaultItems.
 */
export function parseBitwardenCsv(
  csvText: string,
  generateId: () => string = safeGenerateId
): VaultItem[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const folderIdx = headers.indexOf('folder');
  const favoriteIdx = headers.indexOf('favorite');
  const typeIdx = headers.indexOf('type');
  const nameIdx = headers.indexOf('name');
  const notesIdx = headers.indexOf('notes');
  const uriIdx = headers.indexOf('login_uri');
  const usernameIdx = headers.indexOf('login_username');
  const passwordIdx = headers.indexOf('login_password');
  const totpIdx = headers.indexOf('login_totp');

  const now = new Date().toISOString();
  const results: VaultItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = nameIdx !== -1 ? (row[nameIdx] || 'Untitled').trim() : 'Untitled';
    const folder = folderIdx !== -1 ? normalizePod(row[folderIdx] || '') : '';
    const notes = notesIdx !== -1 ? (row[notesIdx] || '') : '';
    const isFav = favoriteIdx !== -1 && (row[favoriteIdx] === '1' || row[favoriteIdx]?.toLowerCase() === 'true');
    const rawType = typeIdx !== -1 ? (row[typeIdx] || 'login').toLowerCase() : 'login';

    const id = generateId();

    if (rawType === 'note') {
      results.push({
        id,
        type: 'note',
        title: name,
        secret: notes,
        notes,
        category: folder,
        tags: isFav ? JSON.stringify(['Favorite']) : '[]',
        attachments: '[]',
        created_at: now,
      });
    } else {
      // Login or card
      const username = usernameIdx !== -1 ? (row[usernameIdx] || '') : '';
      const password = passwordIdx !== -1 ? (row[passwordIdx] || '') : '';
      const url = uriIdx !== -1 ? (row[uriIdx] || '') : '';
      const rawTotp = totpIdx !== -1 ? (row[totpIdx] || '') : '';

      let totpSecret = '';
      if (rawTotp) {
        const parsedTotp = parseTotpSecret(rawTotp);
        if (parsedTotp) {
          totpSecret = formatTotpSecret(parsedTotp, name);
        }
      }

      results.push({
        id,
        type: 'password',
        title: name,
        username,
        secret: password,
        url,
        category: folder,
        notes,
        totp_secret: totpSecret || undefined,
        tags: isFav ? JSON.stringify(['Favorite']) : '[]',
        attachments: '[]',
        created_at: now,
      });
    }
  }

  return results;
}
