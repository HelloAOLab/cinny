import { describe, expect, it } from 'vitest';
import colorMXID, { cssColorMXID } from './colorMXID';

describe('cssColorMXID', () => {
  it('returns one of the 8 defined CSS variable buckets', () => {
    const result = cssColorMXID('@alice:example.org');
    expect(result).toMatch(/^--mx-uc-[1-8]$/);
  });

  it('is deterministic for the same userId', () => {
    expect(cssColorMXID('@alice:example.org')).toBe(cssColorMXID('@alice:example.org'));
  });

  it('handles an empty string without throwing', () => {
    expect(cssColorMXID('')).toBe('--mx-uc-1');
  });

  it('can produce different buckets for different userIds', () => {
    const ids = ['@a:x', '@b:x', '@c:x', '@d:x', '@e:x', '@f:x', '@g:x', '@h:x', '@i:x'];
    const buckets = new Set(ids.map(cssColorMXID));
    expect(buckets.size).toBeGreaterThan(1);
  });
});

describe('colorMXID', () => {
  it('wraps the css variable name in a var() call', () => {
    expect(colorMXID('@alice:example.org')).toBe(`var(${cssColorMXID('@alice:example.org')})`);
  });
});
