import { describe, expect, it } from 'vitest';
import { sanitizeForRegex } from './regex';

describe('sanitizeForRegex', () => {
  it('escapes regex special characters so they match literally', () => {
    const special = '.*+?^${}()|[]\\';
    const pattern = new RegExp(sanitizeForRegex(special));
    expect(pattern.test(special)).toBe(true);
  });

  it('escapes hyphens (relevant inside character classes)', () => {
    expect(sanitizeForRegex('a-b')).toBe('a\\x2db');
  });

  it('leaves plain alphanumeric text unchanged', () => {
    expect(sanitizeForRegex('hello world 123')).toBe('hello world 123');
  });

  it('produces a pattern that does not match unintended characters as metacharacters', () => {
    // Without sanitizing, "a.c" as a regex would match "abc"; sanitized it should not.
    const pattern = new RegExp(sanitizeForRegex('a.c'));
    expect(pattern.test('abc')).toBe(false);
    expect(pattern.test('a.c')).toBe(true);
  });
});
