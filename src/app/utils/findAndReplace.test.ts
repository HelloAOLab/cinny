import { describe, expect, it } from 'vitest';
import { findAndReplace } from './findAndReplace';

describe('findAndReplace', () => {
  it('replaces all global matches and preserves surrounding text order', () => {
    const result = findAndReplace(
      'foo bar foo baz',
      /foo/g,
      (match) => `[${match[0]}]`,
      (text) => text
    );
    expect(result.join('')).toBe('[foo] bar [foo] baz');
  });

  it('only replaces the first match for a non-global regex', () => {
    const result = findAndReplace(
      'foo bar foo baz',
      /foo/,
      (match) => `[${match[0]}]`,
      (text) => text
    );
    expect(result.join('')).toBe('[foo] bar foo baz');
  });

  it('returns the whole text via convertPart when there is no match', () => {
    const converted: string[] = [];
    const result = findAndReplace(
      'no matches here',
      /xyz/g,
      (match) => match[0],
      (text) => {
        converted.push(text);
        return text;
      }
    );
    expect(result.join('')).toBe('no matches here');
    expect(converted).toEqual(['no matches here']);
  });

  it('passes increasing pushIndex values to replace/convertPart callbacks', () => {
    const indices: number[] = [];
    findAndReplace(
      'a1b2c',
      /\d/g,
      (match, pushIndex) => {
        indices.push(pushIndex);
        return match[0];
      },
      (text, pushIndex) => {
        indices.push(pushIndex);
        return text;
      }
    );
    expect(indices).toEqual([0, 1, 2, 3, 4]);
  });

  it('handles an empty input string', () => {
    const result = findAndReplace(
      '',
      /foo/g,
      (match) => match[0],
      (text) => text
    );
    expect(result).toEqual(['']);
  });
});
