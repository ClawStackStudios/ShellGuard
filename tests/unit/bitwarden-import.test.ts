// tests/unit/bitwarden-import.test.ts — Unit tests for Bitwarden import engine.
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  isBitwardenJson,
  isEncryptedBitwardenExport,
  isBitwardenCsv,
  mapBitwardenToVaultItems,
  parseBitwardenCsv,
} from '../../src/lib/bitwarden.ts';
import { parseSshKeySecret } from '../../src/lib/keyGen.ts';
import { parseTotpSecret, generateTotp } from '../../src/lib/totpUtils.ts';

describe('Bitwarden Ingestion Engine', () => {
  const fixturesDir = path.resolve(__dirname, '../fixtures');
  const file1Path = path.join(fixturesDir, 'bitwarden_sample.json');
  const file2Path = path.join(fixturesDir, 'bitwarden_totp.json');

  it('detects Bitwarden JSON export signature', () => {
    const raw1 = JSON.parse(fs.readFileSync(file1Path, 'utf8'));
    const raw2 = JSON.parse(fs.readFileSync(file2Path, 'utf8'));

    expect(isBitwardenJson(raw1)).toBe(true);
    expect(isBitwardenJson(raw2)).toBe(true);
    expect(isEncryptedBitwardenExport(raw1)).toBe(false);
    expect(isEncryptedBitwardenExport(raw2)).toBe(false);

    expect(isBitwardenJson({ items: [{ title: 'Native ShellGuard item' }] })).toBe(false);
    expect(isBitwardenJson({ format: 'shellguard-totp-plain-export-v1' })).toBe(false);
  });

  it('detects encrypted Bitwarden exports gracefully', () => {
    expect(isEncryptedBitwardenExport({ encrypted: true, items: [] })).toBe(true);
    expect(isEncryptedBitwardenExport({ encrypted: false, items: [{ name: '2.c88b...' }] })).toBe(true);
  });

  it('maps bitwarden_export_20260920164329.json correctly into ShellGuard items', () => {
    const raw = JSON.parse(fs.readFileSync(file1Path, 'utf8'));
    const items = mapBitwardenToVaultItems(raw);

    expect(items.length).toBe(3);

    // 1. Password Item
    const passwordItem = items.find(i => i.title === 'Test Bitwarden Password');
    expect(passwordItem).toBeDefined();
    expect(passwordItem?.type).toBe('password');
    expect(passwordItem?.username).toBe('disperser');
    expect(passwordItem?.secret).toBe('Slain5-Nappy-Moonlight');
    expect(passwordItem?.notes).toBe('This is a note');

    // Custom fields on password item
    expect(passwordItem?.custom_fields).toBeDefined();
    const fields = JSON.parse(passwordItem!.custom_fields!);
    expect(fields.length).toBe(2);
    expect(fields[0].name).toBe('This is a text field title');
    expect(fields[0].value).toBe('this is the text field content');
    expect(fields[0].type).toBe('text');
    expect(fields[1].name).toBe('This is a hidden field title');
    expect(fields[1].value).toBe('this is the hidden field content');
    expect(fields[1].type).toBe('hidden');

    // 2. Note Item
    const noteItem = items.find(i => i.title === 'Test note');
    expect(noteItem).toBeDefined();
    expect(noteItem?.type).toBe('note');
    expect(noteItem?.secret).toBe('test note content');
    expect(noteItem?.notes).toBe('test note content');

    // 3. SSH Key Item
    const sshItem = items.find(i => i.title === 'test ssh key');
    expect(sshItem).toBeDefined();
    expect(sshItem?.type).toBe('key');
    expect(sshItem?.secret).toBeDefined();

    // Verify compound SSH key parsing
    const parsedSsh = parseSshKeySecret(sshItem!.secret);
    expect(parsedSsh.privateKey).toContain('-----BEGIN OPENSSH PRIVATE KEY-----');
    expect(parsedSsh.publicKey).toContain('ssh-ed25519 AAAAC3NzaC1lZDI1NTE5');
    expect(Boolean(parsedSsh.publicKey && parsedSsh.privateKey)).toBe(true);
  });

  it('maps bitwarden_export_20260920215518.json and extracts live TOTP seed', () => {
    const raw = JSON.parse(fs.readFileSync(file2Path, 'utf8'));
    const items = mapBitwardenToVaultItems(raw);

    expect(items.length).toBe(3);

    const passwordItem = items.find(i => i.title === 'Test Bitwarden Password');
    expect(passwordItem).toBeDefined();
    expect(passwordItem?.totp_secret).toBeDefined();
    expect(passwordItem?.totp_secret).toBe('JBSWY3DPEHPK3PXP');

    // Test TOTP code generation
    const totpConfig = parseTotpSecret(passwordItem!.totp_secret);
    expect(totpConfig).not.toBeNull();
    expect(totpConfig?.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(totpConfig?.digits).toBe(6);
    expect(totpConfig?.period).toBe(30);

    const generated = generateTotp(totpConfig!);
    expect(generated).not.toBeNull();
    expect(generated?.code.length).toBe(6);
    expect(/^\d{6}$/.test(generated!.code)).toBe(true);
  });

  it('converts Bitwarden folders to normalized ShellGuard Pods', () => {
    const raw = {
      encrypted: false,
      folders: [
        { id: 'folder-1', name: 'Work' },
        { id: 'folder-2', name: 'Work/Infrastructure' },
      ],
      items: [
        {
          type: 1,
          name: 'Server Admin',
          folderId: 'folder-2',
          login: { username: 'admin', password: 'secretpassword' },
        },
        {
          type: 2,
          name: 'Unfiled Note',
          folderId: null,
          notes: 'No folder',
        },
      ],
    };

    const items = mapBitwardenToVaultItems(raw);
    expect(items.length).toBe(2);

    expect(items[0].category).toBe('Work/Infrastructure');
    expect(items[1].category).toBe('');
  });

  it('detects and parses Bitwarden CSV exports', () => {
    const csvContent = [
      'folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp',
      'Production,1,login,AWS Console,"Root AWS account",,0,https://aws.amazon.com,admin@example.com,superpass,JBSWY3DPEHPK3PXP',
      'Personal,0,note,Secret Recipe,"Bake at 350F",,0,,,,',
    ].join('\n');

    expect(isBitwardenCsv(csvContent)).toBe(true);

    const items = parseBitwardenCsv(csvContent);
    expect(items.length).toBe(2);

    expect(items[0].title).toBe('AWS Console');
    expect(items[0].category).toBe('Production');
    expect(items[0].username).toBe('admin@example.com');
    expect(items[0].secret).toBe('superpass');
    expect(items[0].url).toBe('https://aws.amazon.com');
    expect(items[0].totp_secret).toBe('JBSWY3DPEHPK3PXP');
    expect(items[0].tags).toContain('Favorite');

    expect(items[1].title).toBe('Secret Recipe');
    expect(items[1].category).toBe('Personal');
    expect(items[1].type).toBe('note');
    expect(items[1].secret).toBe('Bake at 350F');
  });
});
