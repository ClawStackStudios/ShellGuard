import { describe, it, expect } from 'vitest';
import {
  normalizeCustomFields,
  normalizeCustomFieldType,
  extractShellGuardBackupItems,
} from '../../src/lib/customFieldUtils.js';

describe('Mobile Backup Interop & CustomField Normalization (Issue #34)', () => {
  it('normalizes Mobile { id, label, value, type: "TEXT" | "HIDDEN" | "BOOLEAN" | "LINKED" } and numeric types', () => {
    const mobileJson = JSON.stringify([
      { id: 'cf-1', label: 'First Name', value: 'Jane', type: 'TEXT' },
      { label: 'SSN', value: '123-45-6789', type: 'HIDDEN' },
      { id: 'cf-3', label: 'Primary', value: true, type: 'BOOLEAN' },
      { label: 'Backup', value: '', type: 'LINKED', linkedProperty: 'username' },
      { name: 'NumericHidden', value: 'secret', type: 1 },
    ]);

    const normalized = normalizeCustomFields(mobileJson);
    expect(normalized).toHaveLength(5);

    expect(normalized[0]).toEqual({ id: 'cf-1', name: 'First Name', value: 'Jane', type: 'text' });
    expect(normalized[1].name).toBe('SSN');
    expect(normalized[1].type).toBe('hidden');
    expect(normalized[1].id.length).toBeGreaterThan(0);
    expect(normalized[2]).toEqual({ id: 'cf-3', name: 'Primary', value: 'true', type: 'checkbox' });
    expect(normalized[3].type).toBe('linked');
    expect(normalized[3].linkedProperty).toBe('username');
    expect(normalized[4].type).toBe('hidden');

    // Guarantees ItemDetailPane / ItemFormModal .toLowerCase() lookups never throw
    expect(() => normalized.map(f => f.name.toLowerCase())).not.toThrow();
    expect(normalizeCustomFieldType('CHECKBOX')).toBe('checkbox');
    expect(normalizeCustomFieldType(2)).toBe('checkbox');
  });

  it('flattens legacy Mobile { pearls, notes, sshKeys } backup envelopes cleanly', () => {
    const legacyBackup = {
      version: 1,
      pearls: [
        {
          id: 'p-1',
          title: 'Identity Card',
          type: 'identity',
          username: 'jdoe',
          customFields: [{ id: 'cf-1', label: 'First Name', value: 'Jane', type: 'TEXT' }],
        },
      ],
      notes: [
        { id: 'n-1', title: 'Recovery Codes', content: 'code-123' },
      ],
      sshKeys: [
        { id: 'k-1', title: 'Homelab Key', key_value: '{"publicKey":"ssh-ed25519 ..."}' },
      ],
    };

    const flattened = extractShellGuardBackupItems(legacyBackup);
    expect(flattened).toHaveLength(3);
    expect(flattened![0].type).toBe('identity');
    expect(flattened![0].customFields).toBeDefined();
    expect(flattened![1]).toMatchObject({ id: 'n-1', type: 'note', secret: 'code-123' });
    expect(flattened![2]).toMatchObject({ id: 'k-1', type: 'key' });

    // Standard { items: [...] } and array formats continue working
    expect(extractShellGuardBackupItems({ items: [{ id: 'x' }] })).toEqual([{ id: 'x' }]);
    expect(extractShellGuardBackupItems([{ id: 'y' }])).toEqual([{ id: 'y' }]);
    expect(extractShellGuardBackupItems({ foo: 'bar' })).toBeNull();
  });
});
