import { VaultItem } from '../types.ts';
import { parseTags } from './tagUtils.ts';

/**
 * Robust Unified Vault Search Engine (Client-Side, Zero-Knowledge)
 * 
 * Case-insensitively searches the already-decrypted in-memory vault items across:
 * - Titles
 * - Usernames
 * - Primary URLs and secondary URIs
 * - Note text (login notes and decrypted note item content)
 * - Custom field names and values
 * - Attachment file names
 * - Assigned tag names
 * 
 * Invariants:
 * - Zero-knowledge: runs entirely in-memory client-side; query never touches the network.
 * - Non-destructive: empty/whitespace queries return all items intact without filtering.
 */
export function searchVaultItems(items: VaultItem[], query: string): VaultItem[] {
  if (!items || items.length === 0) return [];
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;

  return items.filter((item) => {
    // 1. Title
    if (item.title && item.title.toLowerCase().includes(trimmed)) return true;

    // 2. Username
    if (item.username && item.username.toLowerCase().includes(trimmed)) return true;

    // 3. Primary URL
    if (item.url && item.url.toLowerCase().includes(trimmed)) return true;

    // 4. Secondary URIs (JSON array of strings)
    if (item.uris) {
      if (item.uris.toLowerCase().includes(trimmed)) return true;
    }

    // 5. Notes (pearl notes or secure note content in secret)
    if (item.notes && item.notes.toLowerCase().includes(trimmed)) return true;
    if (item.type === 'note' && item.secret && item.secret.toLowerCase().includes(trimmed)) return true;

    // 6. Attachment file name
    if (item.file_name && item.file_name.toLowerCase().includes(trimmed)) return true;

    // 7. Custom Fields (names and values)
    if (item.custom_fields) {
      try {
        const fields = JSON.parse(item.custom_fields);
        if (Array.isArray(fields)) {
          for (const f of fields) {
            if (f && typeof f === 'object') {
              if (f.name && String(f.name).toLowerCase().includes(trimmed)) return true;
              if (f.value && String(f.value).toLowerCase().includes(trimmed)) return true;
            }
          }
        } else if (item.custom_fields.toLowerCase().includes(trimmed)) {
          return true;
        }
      } catch {
        if (item.custom_fields.toLowerCase().includes(trimmed)) return true;
      }
    }

    // 8. Tags (parseTags handles JSON or comma-separated tags)
    if (item.tags) {
      const parsed = parseTags(item.tags);
      for (const t of parsed) {
        if (t.name.toLowerCase().includes(trimmed)) return true;
      }
    }

    return false;
  });
}
