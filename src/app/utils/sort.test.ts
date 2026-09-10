import { describe, expect, it } from 'vitest';
import { byOrderKey, byTsOldToNew } from './sort';

describe('byTsOldToNew', () => {
  it('sorts numbers ascending', () => {
    expect([5, 1, 3].sort(byTsOldToNew)).toEqual([1, 3, 5]);
  });
});

describe('byOrderKey', () => {
  it('sorts strings lexicographically', () => {
    expect(['b', 'a', 'c'].sort(byOrderKey)).toEqual(['a', 'b', 'c']);
  });

  it('treats undefined as sorting after any defined value', () => {
    expect(['b', undefined, 'a'].sort(byOrderKey)).toEqual(['a', 'b', undefined]);
  });

  it('treats two undefined values as equal', () => {
    expect(byOrderKey(undefined, undefined)).toBe(0);
  });
});
