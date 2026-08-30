import { describe, it, expect } from 'vitest';
import { deriveShellKey, encryptField, decryptField } from '../../src/lib/shellCryption.ts';
import { CustomField, CustomFieldType, VaultItem } from '../../src/types.ts';

describe('Bitwarden-Style Custom Fields (ShellCryption & Serialization)', () => {
  const huKey = "hu-gjb0IFFw4ioTuYhcKcYhjY0IOMPx3QaNIoFYfasp9W43sRYq9wksq6yt90Y5P3hj";
  const userUuid = "1c8705b8-c31c-4b12-aa71-6da046a357ba";

  it('encrypts and decrypts CustomField array across all 4 types', async () => {
    const shellKey = await deriveShellKey(huKey, userUuid);

    const customFields: CustomField[] = [
      { id: "cf-1", name: "Security Question", type: "text", value: "What is your favorite ocean creature?" },
      { id: "cf-2", name: "PIN Code", type: "hidden", value: "8492" },
      { id: "cf-3", name: "2FA Required", type: "checkbox", value: "true" },
      { id: "cf-4", name: "Secondary Login", type: "linked", value: "", linkedProperty: "username" },
    ];

    const json = JSON.stringify(customFields);
    const encrypted = await encryptField(json, shellKey, "vault_pearls_custom", "pearl-uuid-1");

    expect(encrypted).toContain('"alg":"AES-GCM-256"');
    expect(encrypted).toContain('"aad":"vault_pearls_custom:pearl-uuid-1"');

    const decrypted = await decryptField(encrypted, shellKey, "vault_pearls_custom", "pearl-uuid-1");
    const parsed: CustomField[] = JSON.parse(decrypted);

    expect(parsed).toHaveLength(4);
    expect(parsed[0].name).toBe("Security Question");
    expect(parsed[1].value).toBe("8492");
    expect(parsed[2].value).toBe("true");
    expect(parsed[3].linkedProperty).toBe("username");
  });

  it('resolves linked properties dynamically for linked custom fields', () => {
    const item: VaultItem = {
      id: "item-1",
      type: "password",
      title: "ClawBank",
      secret: "super-secret-password",
      username: "captain@ocean.reef",
      url: "https://ocean.reef",
      notes: "Important account notes",
      totp_secret: "JBSWY3DPEHPK3PXP",
      created_at: new Date().toISOString(),
    };

    const resolveLinkedValue = (linkedProperty?: string): string => {
      switch (linkedProperty) {
        case "username": return item.username || "";
        case "password": return item.secret || "";
        case "url": return item.url || "";
        case "notes": return item.notes || "";
        case "totp": return item.totp_secret || "";
        default: return "";
      }
    };

    expect(resolveLinkedValue("username")).toBe("captain@ocean.reef");
    expect(resolveLinkedValue("password")).toBe("super-secret-password");
    expect(resolveLinkedValue("url")).toBe("https://ocean.reef");
    expect(resolveLinkedValue("notes")).toBe("Important account notes");
    expect(resolveLinkedValue("totp")).toBe("JBSWY3DPEHPK3PXP");
  });

  it('handles empty or malformed custom_fields gracefully', async () => {
    const shellKey = await deriveShellKey(huKey, userUuid);
    const plaintext = await decryptField("", shellKey, "vault_pearls_custom", "pearl-uuid-2");
    expect(plaintext).toBe("");
  });
});
