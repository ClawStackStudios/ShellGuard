// tests/unit/cardUtils.test.ts — Unit tests for credit card formatting, masking, and brand detection.
import { describe, it, expect } from 'vitest';
import {
  detectCardBrand,
  formatCardNumber,
  maskCardNumber,
  cleanCardNumber,
} from '../../src/lib/cardUtils.ts';

describe('Card Utilities (cardUtils)', () => {
  it('detects card brand based on prefixes accurately', () => {
    expect(detectCardBrand('4123456789012345')).toBe('Visa');
    expect(detectCardBrand('5123456789012345')).toBe('Mastercard');
    expect(detectCardBrand('2221000000000000')).toBe('Mastercard');
    expect(detectCardBrand('341234567890123')).toBe('American Express');
    expect(detectCardBrand('371234567890123')).toBe('American Express');
    expect(detectCardBrand('6011000000000000')).toBe('Discover');
    expect(detectCardBrand('6500000000000000')).toBe('Discover');
    expect(detectCardBrand('36000000000000')).toBe('Diners Club');
    expect(detectCardBrand('3530000000000000')).toBe('JCB');
    expect(detectCardBrand('9999000000000000')).toBe('Payment Card');
    expect(detectCardBrand('')).toBe('Payment Card');
  });

  it('formats standard 16-digit cards with 4-4-4-4 spacing as user types', () => {
    expect(formatCardNumber('4111')).toBe('4111');
    expect(formatCardNumber('41111')).toBe('4111 1');
    expect(formatCardNumber('41111111')).toBe('4111 1111');
    expect(formatCardNumber('411111112222')).toBe('4111 1111 2222');
    expect(formatCardNumber('4111111122223333')).toBe('4111 1111 2222 3333');
    // Truncates at max standard card length
    expect(formatCardNumber('411111112222333399999')).toBe('4111 1111 2222 3333 999');
  });

  it('formats American Express cards with smart 4-6-5 spacing', () => {
    expect(formatCardNumber('37')).toBe('37');
    expect(formatCardNumber('3712')).toBe('3712');
    expect(formatCardNumber('37123')).toBe('3712 3');
    expect(formatCardNumber('3712345678')).toBe('3712 345678');
    expect(formatCardNumber('37123456781')).toBe('3712 345678 1');
    expect(formatCardNumber('371234567812345')).toBe('3712 345678 12345');
    // Truncates Amex at 15 digits
    expect(formatCardNumber('371234567812345999')).toBe('3712 345678 12345');
  });

  it('masks card numbers truthfully according to length and network structure', () => {
    // 16-digit Visa
    expect(maskCardNumber('4123456789012345')).toBe('•••• •••• •••• 2345');
    // 15-digit Amex
    expect(maskCardNumber('371234567812345')).toBe('•••• •••••• •2345');
    // 10-digit test card (fixtures parity)
    expect(maskCardNumber('1234567890')).toBe('•••• ••78 90');
    // Short numbers (<= 4 digits) show cleanly without masking
    expect(maskCardNumber('1234')).toBe('1234');
    expect(maskCardNumber('')).toBe('•••• •••• •••• ••••');
  });

  it('strips spaces and symbols for clean checkout pasting', () => {
    expect(cleanCardNumber('4123 4567 8901 2345')).toBe('4123456789012345');
    expect(cleanCardNumber('3712-345678-12345')).toBe('371234567812345');
    expect(cleanCardNumber(' 1234  5678 ')).toBe('12345678');
  });
});
