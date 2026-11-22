import { generateUUID } from './crypto.ts';
import type { CustomField, CustomFieldLinkedProperty, CustomFieldType } from '../types.ts';

const VALID_LINKED_PROPS = new Set<CustomFieldLinkedProperty>(['username', 'password', 'url', 'notes', 'totp']);

/** Normalize Mobile/Bitwarden/Web custom field type variants into canonical Web CustomFieldType. */
export function normalizeCustomFieldType(rawType: unknown): CustomFieldType {
  if (typeof rawType === 'number') {
    if (rawType === 1) return 'hidden';
    if (rawType === 2) return 'checkbox';
    if (rawType === 3) return 'linked';
    return 'text';
  }
  if (typeof rawType === 'string') {
    const lower = rawType.trim().toLowerCase();
    if (lower === 'hidden') return 'hidden';
    if (lower === 'boolean' || lower === 'checkbox') return 'checkbox';
    if (lower === 'linked') return 'linked';
    if (lower === 'text') return 'text';
  }
  return 'text';
}

/**
 * Normalize decrypted or imported custom_fields (JSON string or array) into canonical Web CustomField[].
 * Prevents runtime errors when Mobile records use `{ label, type: "TEXT" }` instead of `{ name, type: "text" }`.
 */
export function normalizeCustomFields(raw: string | unknown[] | null | undefined): CustomField[] {
  if (!raw) return [];
  let list: unknown[];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return [];
      list = parsed;
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    list = raw;
  } else {
    return [];
  }

  const out: CustomField[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const f = entry as Record<string, unknown>;
    const rawName = typeof f.name === 'string' && f.name.trim()
      ? f.name.trim()
      : typeof f.label === 'string' && f.label.trim()
        ? f.label.trim()
        : 'Field';
    const id = typeof f.id === 'string' && f.id.trim() ? f.id.trim() : generateUUID();
    const value = f.value !== undefined && f.value !== null ? String(f.value) : '';
    const type = normalizeCustomFieldType(f.type);
    const linkedProperty =
      typeof f.linkedProperty === 'string' && VALID_LINKED_PROPS.has(f.linkedProperty as CustomFieldLinkedProperty)
        ? (f.linkedProperty as CustomFieldLinkedProperty)
        : undefined;

    out.push({
      id,
      name: rawName,
      type,
      value,
      ...(linkedProperty ? { linkedProperty } : {}),
    });
  }
  return out;
}

/**
 * Flatten ShellGuard JSON backups across array exports, `{ items: [...] }`,
 * and legacy Mobile `{ pearls, notes, sshKeys }` envelopes.
 * Returns null if the object is not a recognized ShellGuard backup shape.
 */
export function extractShellGuardBackupItems(parsed: any): any[] | null {
  if (Array.isArray(parsed)) return parsed;
  if (!parsed || typeof parsed !== 'object') return null;

  if (Array.isArray(parsed.items) && parsed.items.length > 0) {
    return parsed.items;
  }

  const hasLegacyArrays =
    Array.isArray(parsed.pearls) ||
    Array.isArray(parsed.notes) ||
    Array.isArray(parsed.sshKeys);

  if (hasLegacyArrays) {
    const flattened: any[] = [];
    if (Array.isArray(parsed.pearls)) {
      for (const p of parsed.pearls) {
        if (!p || typeof p !== 'object') continue;
        flattened.push({ ...p, type: p.type || 'password' });
      }
    }
    if (Array.isArray(parsed.notes)) {
      for (const n of parsed.notes) {
        if (!n || typeof n !== 'object') continue;
        flattened.push({
          ...n,
          type: 'note',
          secret: n.secret || n.content || n.notes || n.title || 'Note',
        });
      }
    }
    if (Array.isArray(parsed.sshKeys)) {
      for (const k of parsed.sshKeys) {
        if (!k || typeof k !== 'object') continue;
        flattened.push({
          ...k,
          type: 'key',
          secret: k.secret || k.key_value || '',
        });
      }
    }
    return flattened;
  }

  if (Array.isArray(parsed.items)) {
    return parsed.items;
  }

  return null;
}
