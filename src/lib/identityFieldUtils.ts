import { generateUUID } from './crypto.ts';
import { normalizeCustomFields } from './customFieldUtils.ts';
import type { CustomField } from '../types.ts';

export interface IdentityFormValues {
  title: string;
  firstName: string;
  middleName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  ssn: string;
  passport: string;
  license: string;
}

export interface IdentityDetail extends IdentityFormValues {
  fullName: string;
  username: string;
  location: string;
  fullAddress: string;
}

export const EMPTY_IDENTITY_FORM: IdentityFormValues = {
  title: '',
  firstName: '',
  middleName: '',
  lastName: '',
  company: '',
  email: '',
  phone: '',
  address1: '',
  address2: '',
  address3: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  ssn: '',
  passport: '',
  license: '',
};

const IDENTITY_FIELD_KEY_SET = new Set([
  'title',
  'first name',
  'middle name',
  'last name',
  'full name',
  'username',
  'company',
  'email',
  'phone',
  'address 1',
  'address1',
  'address 2',
  'address2',
  'address 3',
  'address3',
  'city',
  'state / province',
  'state',
  'postal code',
  'zip',
  'country',
  'location',
  'ssn',
  'passport number',
  'passport',
  'license number',
  'license',
]);

/**
 * Project an encrypted/decrypted `vault_pearls(type = "identity")` record into
 * structured Identity fields. Accepts both Web (`name`, `"text"`) and Mobile
 * (`label`, `"TEXT"`) `custom_fields` shapes via `normalizeCustomFields()`.
 */
export function extractIdentityDetails(
  item: {
    title?: string | null;
    username?: string | null;
    custom_fields?: string | unknown[] | null;
  } | null | undefined
): IdentityDetail | null {
  if (!item) return null;

  const customFields = normalizeCustomFields(item.custom_fields);
  const getVal = (names: string[]): string => {
    const match = customFields.find((f) => names.includes(f.name.toLowerCase()));
    return match ? match.value : '';
  };

  const title = getVal(['title']);
  const firstName = getVal(['first name']);
  const middleName = getVal(['middle name']);
  const lastName = getVal(['last name']);
  const itemUsername = item.username ?? '';
  const itemTitle = item.title ?? '';

  const fullName =
    getVal(['full name']) ||
    [firstName, middleName, lastName].filter(Boolean).join(' ') ||
    itemUsername ||
    itemTitle;

  const username = getVal(['username']) || (itemUsername !== fullName ? itemUsername : '');
  const company = getVal(['company']);
  const email = getVal(['email']);
  const phone = getVal(['phone']);

  const address1 = getVal(['address 1', 'address1']);
  const address2 = getVal(['address 2', 'address2']);
  const address3 = getVal(['address 3', 'address3']);
  const city = getVal(['city']);
  const state = getVal(['state / province', 'state']);
  const postalCode = getVal(['postal code', 'zip']);
  const country = getVal(['country']);
  const location =
    getVal(['location']) ||
    [city, state, postalCode, country].filter(Boolean).join(', ');
  const fullAddress = [address1, address2, address3, location].filter(Boolean).join('\n');

  const ssn = getVal(['ssn']);
  const passport = getVal(['passport number', 'passport']);
  const license = getVal(['license number', 'license']);

  return {
    title,
    firstName,
    middleName,
    lastName,
    fullName,
    username,
    company,
    email,
    phone,
    address1,
    address2,
    address3,
    city,
    state,
    postalCode,
    country,
    location,
    fullAddress,
    ssn,
    passport,
    license,
  };
}

/**
 * Strip prior Identity keys from `existingCustomFields` (preserving user-added custom fields)
 * and append canonical Web/Mobile `CustomField[]` entries.
 */
export function buildIdentityCustomFields(
  existingCustomFields: CustomField[],
  values: IdentityFormValues,
  username = ''
): CustomField[] {
  const preserved = existingCustomFields.filter(
    (f) => !IDENTITY_FIELD_KEY_SET.has(f.name.trim().toLowerCase())
  );

  const pushText = (name: string, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed) {
      preserved.push({ id: generateUUID(), name, type: 'text', value: trimmed });
    }
  };

  const pushHidden = (name: string, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed) {
      preserved.push({ id: generateUUID(), name, type: 'hidden', value: trimmed });
    }
  };

  const fullName = [values.firstName.trim(), values.middleName.trim(), values.lastName.trim()]
    .filter(Boolean)
    .join(' ');

  pushText('Title', values.title);
  pushText('First Name', values.firstName);
  pushText('Middle Name', values.middleName);
  pushText('Last Name', values.lastName);
  pushText('Full Name', fullName);
  pushText('Username', username);
  pushText('Company', values.company);
  pushText('Email', values.email);
  pushText('Phone', values.phone);
  pushText('Address 1', values.address1);
  pushText('Address 2', values.address2);
  pushText('Address 3', values.address3);
  pushText('City', values.city);
  pushText('State / Province', values.state);
  pushText('Postal Code', values.postalCode);
  pushText('Country', values.country);

  const location = [
    values.city.trim(),
    values.state.trim(),
    values.postalCode.trim(),
    values.country.trim(),
  ]
    .filter(Boolean)
    .join(', ');
  pushText('Location', location);

  pushHidden('SSN', values.ssn);
  pushHidden('Passport Number', values.passport);
  pushHidden('License Number', values.license);

  return preserved;
}

/**
 * Resolve top-level `vault_pearls.username` and non-empty `vault_pearls.secret`
 * matching both Web and Mobile `IdentityFieldMapper`.
 */
export function resolveIdentityUsernameAndSecret(params: {
  title: string;
  username: string;
  notes: string;
  values: IdentityFormValues;
}): { fullName: string; username: string; secret: string } {
  const fullName = [
    params.values.firstName.trim(),
    params.values.middleName.trim(),
    params.values.lastName.trim(),
  ]
    .filter(Boolean)
    .join(' ');

  const username = params.username.trim() || fullName || '';
  const secret =
    params.notes.trim() ||
    fullName ||
    params.username.trim() ||
    params.title.trim();

  return { fullName, username, secret };
}
