import { describe, expect, it } from 'vitest';
import { getSpaceFeedPath } from './pathUtils';

describe('getSpaceFeedPath', () => {
  it('builds a feed path scoped to the given space', () => {
    expect(getSpaceFeedPath('!space:example.org')).toBe('/!space%3Aexample.org/feed');
  });

  it('encodes a space alias', () => {
    expect(getSpaceFeedPath('#space:example.org')).toBe('/%23space%3Aexample.org/feed');
  });
});
