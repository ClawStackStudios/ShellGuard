import { describe, it, expect } from 'vitest';
import {
  EMPTY_IDENTITY_FORM,
  extractIdentityDetails,
  buildIdentityCustomFields,
  resolveIdentityUsernameAndSecret,
} from '../../src/lib/identityFieldUtils.ts';
import type { CustomField } from '../../src/types.ts';

describe('identityFieldUtils — Web↔Mobile Identity Wire Contract', () => {
  it('round-trips all 18 Identity fields through buildIdentityCustomFields and extractIdentityDetails', () => {
    const form = {
      title: 'Dr',
      firstName: 'Ada',
      middleName: 'Augusta',
      lastName: 'Lovelace',
      company: 'Analytical Engine Co',
      email: 'ada@engine.example',
      phone: '+44 20 7946 0958',
      address1: '10 St James Square',
      address2: 'Suite 4',
      address3: 'Floor 2',
      city: 'London',
      state: 'Greater London',
      postalCode: 'SW1Y 4LB',
      country: 'UK',
      ssn: '000-00-0001',
      passport: 'UK-998877',
      license: 'DL-445566',
    };

    const extraField: CustomField = {
      id: 'extra-1',
      name: 'Department',
      type: 'text',
      value: 'Mathematics',
    };

    const built = buildIdentityCustomFields([extraField], form, 'ada_l');

    // Preserves extra custom fields while emitting canonical lowercase Web/Mobile types
    expect(built.find((f) => f.name === 'Department')?.value).toBe('Mathematics');
    expect(built.find((f) => f.name === 'SSN')?.type).toBe('hidden');
    expect(built.find((f) => f.name === 'Passport Number')?.type).toBe('hidden');
    expect(built.find((f) => f.name === 'License Number')?.type).toBe('hidden');
    expect(built.find((f) => f.name === 'First Name')?.type).toBe('text');

    const extracted = extractIdentityDetails({
      title: 'Ada Profile',
      username: 'ada_l',
      custom_fields: JSON.stringify(built),
    });

    expect(extracted).not.toBeNull();
    expect(extracted?.title).toBe('Dr');
    expect(extracted?.firstName).toBe('Ada');
    expect(extracted?.middleName).toBe('Augusta');
    expect(extracted?.lastName).toBe('Lovelace');
    expect(extracted?.fullName).toBe('Ada Augusta Lovelace');
    expect(extracted?.username).toBe('ada_l');
    expect(extracted?.company).toBe('Analytical Engine Co');
    expect(extracted?.email).toBe('ada@engine.example');
    expect(extracted?.phone).toBe('+44 20 7946 0958');
    expect(extracted?.address1).toBe('10 St James Square');
    expect(extracted?.address2).toBe('Suite 4');
    expect(extracted?.address3).toBe('Floor 2');
    expect(extracted?.city).toBe('London');
    expect(extracted?.state).toBe('Greater London');
    expect(extracted?.postalCode).toBe('SW1Y 4LB');
    expect(extracted?.country).toBe('UK');
    expect(extracted?.location).toBe('London, Greater London, SW1Y 4LB, UK');
    expect(extracted?.ssn).toBe('000-00-0001');
    expect(extracted?.passport).toBe('UK-998877');
    expect(extracted?.license).toBe('DL-445566');
  });

  it('extracts Mobile-written { label, type: "TEXT" | "HIDDEN" } and alias keys seamlessly', () => {
    const mobilePayload = JSON.stringify([
      { id: '1', label: 'First Name', value: 'Grace', type: 'TEXT' },
      { id: '2', label: 'Last Name', value: 'Hopper', type: 'TEXT' },
      { id: '3', label: 'State', value: 'VA', type: 'TEXT' },
      { id: '4', label: 'Zip', value: '22201', type: 'TEXT' },
      { id: '5', label: 'Passport', value: 'US-12345', type: 'HIDDEN' },
      { id: '6', label: 'License', value: 'VA-99999', type: 'HIDDEN' },
    ]);

    const extracted = extractIdentityDetails({
      title: 'Admiral',
      username: '',
      custom_fields: mobilePayload,
    });

    expect(extracted?.fullName).toBe('Grace Hopper');
    expect(extracted?.state).toBe('VA');
    expect(extracted?.postalCode).toBe('22201');
    expect(extracted?.passport).toBe('US-12345');
    expect(extracted?.license).toBe('VA-99999');
  });

  it('guarantees non-empty secret fallback order: notes -> fullName -> username -> title', () => {
    expect(
      resolveIdentityUsernameAndSecret({
        title: 'Profile Title',
        username: 'handle',
        notes: 'Explicit notes',
        values: { ...EMPTY_IDENTITY_FORM, firstName: 'Ada', lastName: 'Lovelace' },
      })
    ).toEqual({
      fullName: 'Ada Lovelace',
      username: 'handle',
      secret: 'Explicit notes',
    });

    expect(
      resolveIdentityUsernameAndSecret({
        title: 'Profile Title',
        username: '',
        notes: '',
        values: { ...EMPTY_IDENTITY_FORM, firstName: 'Ada', lastName: 'Lovelace' },
      })
    ).toEqual({
      fullName: 'Ada Lovelace',
      username: 'Ada Lovelace',
      secret: 'Ada Lovelace',
    });

    expect(
      resolveIdentityUsernameAndSecret({
        title: 'Fallback Title',
        username: '',
        notes: '',
        values: EMPTY_IDENTITY_FORM,
      })
    ).toEqual({
      fullName: '',
      username: '',
      secret: 'Fallback Title',
    });
  });
});
