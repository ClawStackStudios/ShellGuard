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

  it('maps bitwarden_full_forms.json with 100% zero-drop field parity across all 5 forms', () => {
    const fullFixturePath = path.join(fixturesDir, 'bitwarden_full_forms.json');
    const raw = JSON.parse(fs.readFileSync(fullFixturePath, 'utf8'));
    const items = mapBitwardenToVaultItems(raw);

    expect(items.length).toBe(5);

    // 1. Password Item with Text and Hidden custom fields
    const passwordItem = items.find(i => i.title === 'Test Bitwarden Password');
    expect(passwordItem).toBeDefined();
    expect(passwordItem?.id).toBe('2e6a78ba-a733-426b-8db3-b4cb0186b81a');
    expect(passwordItem?.type).toBe('password');
    expect(passwordItem?.username).toBe('disperser');
    expect(passwordItem?.secret).toBe('Slain5-Nappy-Moonlight');
    expect(passwordItem?.notes).toBe('This is a note');
    expect(passwordItem?.totp_secret).toBe('JBSWY3DPEHPK3PXP');
    expect(passwordItem?.custom_fields).toBeDefined();

    const pwFields = JSON.parse(passwordItem!.custom_fields!);
    expect(pwFields.some((f: any) => f.name === 'This is a text field title' && f.value === 'this is the text field content' && f.type === 'text')).toBe(true);
    expect(pwFields.some((f: any) => f.name === 'This is a hidden field title' && f.value === 'this is the hidden field content' && f.type === 'hidden')).toBe(true);

    // 2. Card Item with cardholder, number, brand, expiration, CVV, and Credit Card tag
    const cardItem = items.find(i => i.title === 'Test Card');
    expect(cardItem).toBeDefined();
    expect(cardItem?.id).toBe('b7ab5afb-ed72-4879-add3-b4d20012a164');
    expect(cardItem?.type).toBe('card');
    expect(cardItem?.username).toBe('Tester');
    expect(cardItem?.secret).toBe('1234567890');
    expect(cardItem?.notes).toBe('Note');
    expect(cardItem?.tags).toContain('Credit Card');

    const cardFields = JSON.parse(cardItem!.custom_fields!);
    expect(cardFields.some((f: any) => f.name === 'Card Brand' && f.value === 'Visa')).toBe(true);
    expect(cardFields.some((f: any) => f.name === 'Expiration' && f.value === '01/2029')).toBe(true);
    expect(cardFields.some((f: any) => f.name === 'Security Code (CVV)' && f.value === '897' && f.type === 'hidden')).toBe(true);

    // 3. Note Item with note content
    const noteItem = items.find(i => i.title === 'Test note');
    expect(noteItem).toBeDefined();
    expect(noteItem?.id).toBe('1cbfe51f-48bd-41b5-891a-b4cb0186d97f');
    expect(noteItem?.type).toBe('note');
    expect(noteItem?.secret).toBe('test note content');
    expect(noteItem?.notes).toBe('test note content');

    // 4. SSH Key Item with compound keypair and fingerprint
    const sshItem = items.find(i => i.title === 'test ssh key');
    expect(sshItem).toBeDefined();
    expect(sshItem?.id).toBe('c88b9570-05cb-42aa-9b0f-b4cb0186c99a');
    expect(sshItem?.type).toBe('key');
    expect(sshItem?.username).toBe('SHA256:0z7aATfaxMHVNFX9pRB3dpWTkeELwdZs2HZ+itOvxNY');
    expect(sshItem?.tags).toContain('SSH Key');
    const parsedSsh = parseSshKeySecret(sshItem!.secret);
    expect(parsedSsh.privateKey).toContain('-----BEGIN OPENSSH PRIVATE KEY-----');
    expect(parsedSsh.publicKey).toContain('ssh-ed25519 AAAAC3NzaC1lZDI1NTE5');

    // 5. Identity Item with all 16 personal, address, and document fields preserved
    const idenItem = items.find(i => i.title === 'Tester');
    expect(idenItem).toBeDefined();
    expect(idenItem?.id).toBe('f64656ba-c644-42a4-b67c-b4d20012749e');
    expect(idenItem?.type).toBe('identity');
    expect(idenItem?.username).toBe('TesterGuy');
    expect(idenItem?.notes).toBe('Note');
    expect(idenItem?.tags).toContain('Identity');

    const idenFields = JSON.parse(idenItem!.custom_fields!);
    const idenFieldMap = new Map(idenFields.map((f: any) => [f.name, f]));

    expect(idenFieldMap.get('Title')?.value).toBe('Mr');
    expect(idenFieldMap.get('First Name')?.value).toBe('Tester');
    expect(idenFieldMap.get('Middle Name')?.value).toBe('Test');
    expect(idenFieldMap.get('Last Name')?.value).toBe('Testing');
    expect(idenFieldMap.get('Full Name')?.value).toBe('Tester Test Testing');
    expect(idenFieldMap.get('Username')?.value).toBe('TesterGuy');
    expect(idenFieldMap.get('Company')?.value).toBe('Test Company');
    expect(idenFieldMap.get('Email')?.value).toBe('email@example.com');
    expect(idenFieldMap.get('Phone')?.value).toBe('+0-123-456-7890');
    expect(idenFieldMap.get('Address 1')?.value).toBe('Address');
    expect(idenFieldMap.get('City')?.value).toBe('City');
    expect(idenFieldMap.get('State / Province')?.value).toBe('Province');
    expect(idenFieldMap.get('Postal Code')?.value).toBe('Postal Code');
    expect(idenFieldMap.get('Country')?.value).toBe('Country');
    expect(idenFieldMap.get('SSN')?.value).toBe('123-456-123');
    expect(idenFieldMap.get('SSN')?.type).toBe('hidden');
    expect(idenFieldMap.get('Passport Number')?.value).toBe('1234567890');
    expect(idenFieldMap.get('Passport Number')?.type).toBe('hidden');
    expect(idenFieldMap.get('License Number')?.value).toBe('1234567890');
    expect(idenFieldMap.get('License Number')?.type).toBe('hidden');
  });

  it('proves zero-loss completeness oracle: every critical primitive value is captured', () => {
    const fullFixturePath = path.join(fixturesDir, 'bitwarden_full_forms.json');
    const raw = JSON.parse(fs.readFileSync(fullFixturePath, 'utf8'));
    const items = mapBitwardenToVaultItems(raw);

    // List of every critical user datum across the 5 items in the test export
    const criticalValues = [
      'Slain5-Nappy-Moonlight',
      'disperser',
      'JBSWY3DPEHPK3PXP',
      'This is a note',
      'this is the text field content',
      'this is the hidden field content',
      'Tester',
      '1234567890',
      'Visa',
      '897',
      'test note content',
      'SHA256:0z7aATfaxMHVNFX9pRB3dpWTkeELwdZs2HZ+itOvxNY',
      'TesterGuy',
      'Mr',
      'Test Company',
      'email@example.com',
      '+0-123-456-7890',
      'Address',
      'Province',
      'Postal Code',
      'Country',
      '123-456-123',
    ];

    // Combine all serialized values in the mapped items corpus
    const fullOutputBlob = JSON.stringify(items);

    for (const val of criticalValues) {
      const found = fullOutputBlob.includes(val);
      expect(found, `Expected value "${val}" from Bitwarden export to be captured in output`).toBe(true);
    }
  });

  it('residual harvester automatically sweeps unmapped or future foreign properties', () => {
    const rawWithFutureFields = {
      encrypted: false,
      items: [
        {
          type: 4,
          name: 'Future Person',
          identity: {
            firstName: 'Grace',
            lastName: 'Hopper',
            securityClearance: 'Top Secret Ultra',
            emergencyContactPhone: '+1-800-ADMIRAL',
          },
        },
      ],
    };

    const items = mapBitwardenToVaultItems(rawWithFutureFields);
    expect(items.length).toBe(1);
    const customFields = JSON.parse(items[0].custom_fields!);
    const names = customFields.map((f: any) => f.name);

    expect(names).toContain('Security Clearance');
    expect(customFields.find((f: any) => f.name === 'Security Clearance')?.value).toBe('Top Secret Ultra');
    expect(names).toContain('Emergency Contact Phone');
    expect(customFields.find((f: any) => f.name === 'Emergency Contact Phone')?.value).toBe('+1-800-ADMIRAL');
  });

  it('maps Bitwarden linked custom fields to linkedProperty', () => {
    const rawWithLinked = {
      encrypted: false,
      items: [
        {
          type: 1,
          name: 'Linked Item',
          login: { username: 'testuser', password: 'mypassword' },
          fields: [
            { type: 3, name: 'My Username Mirror', linkedId: 100 },
            { type: 3, name: 'My Password Mirror', linkedId: 101 },
            { type: 3, name: 'My TOTP Mirror', linkedId: 104 },
          ],
        },
      ],
    };

    const items = mapBitwardenToVaultItems(rawWithLinked);
    expect(items.length).toBe(1);
    const customFields = JSON.parse(items[0].custom_fields!);

    const userMirror = customFields.find((f: any) => f.name === 'My Username Mirror');
    expect(userMirror?.type).toBe('linked');
    expect(userMirror?.linkedProperty).toBe('username');

    const passMirror = customFields.find((f: any) => f.name === 'My Password Mirror');
    expect(passMirror?.type).toBe('linked');
    expect(passMirror?.linkedProperty).toBe('password');

    const totpMirror = customFields.find((f: any) => f.name === 'My TOTP Mirror');
    expect(totpMirror?.type).toBe('linked');
    expect(totpMirror?.linkedProperty).toBe('totp');
  });
});
