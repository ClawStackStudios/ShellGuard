// src/lib/cardUtils.ts — Credit card formatting, brand detection, and masking utilities.

export type CardBrand = 'Visa' | 'Mastercard' | 'American Express' | 'Discover' | 'Diners Club' | 'JCB' | 'Payment Card';

/**
 * Detects credit card brand based on industry IIN/BIN prefixes.
 */
export function detectCardBrand(value: string): CardBrand {
  const clean = value.replace(/\D/g, '');
  if (!clean) return 'Payment Card';

  if (clean.startsWith('4')) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(clean)) return 'Mastercard';
  if (/^(34|37)/.test(clean)) return 'American Express';
  if (/^(6011|65|64[4-9]|622)/.test(clean)) return 'Discover';
  if (/^(36|38|30[0-5])/.test(clean)) return 'Diners Club';
  if (/^(352[8-9]|35[3-8][0-9])/.test(clean)) return 'JCB';

  return 'Payment Card';
}

/**
 * Formats a card number with spaces as the user types.
 * Network-aware: Amex uses 4-6-5, others use 4-4-4-4.
 */
export function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (!clean) return '';

  const isAmex = clean.startsWith('34') || clean.startsWith('37');

  if (isAmex) {
    const trimmed = clean.slice(0, 15);
    const p1 = trimmed.slice(0, 4);
    const p2 = trimmed.slice(4, 10);
    const p3 = trimmed.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }

  const trimmed = clean.slice(0, 19);
  const parts: string[] = [];
  for (let i = 0; i < trimmed.length; i += 4) {
    parts.push(trimmed.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Produces length-truthful, block-aligned masked card representation.
 * Preserves the last 4 digits unmasked, and masks the rest with bullets.
 */
export function maskCardNumber(value: string): string {
  const clean = value.replace(/\D/g, '');
  if (!clean) return '•••• •••• •••• ••••';
  if (clean.length <= 4) return clean;

  const isAmex = clean.startsWith('34') || clean.startsWith('37');
  const visibleCount = 4;
  const maskedCount = clean.length - visibleCount;
  const maskedDigits = '•'.repeat(maskedCount) + clean.slice(-visibleCount);

  if (isAmex) {
    const trimmed = maskedDigits.slice(0, 15);
    const p1 = trimmed.slice(0, 4);
    const p2 = trimmed.slice(4, 10);
    const p3 = trimmed.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(' ');
  }

  const parts: string[] = [];
  for (let i = 0; i < Math.min(maskedDigits.length, 19); i += 4) {
    parts.push(maskedDigits.slice(i, i + 4));
  }
  return parts.join(' ');
}

/**
 * Returns raw digits with all spaces/dashes stripped for safe checkout form pasting.
 */
export function cleanCardNumber(value: string): string {
  return value.replace(/\D/g, '');
}
