import { describe, expect, it } from 'vitest';
import {
  binarySearch,
  bytesToSize,
  millisecondsToMinutes,
  millisecondsToMinutesAndSeconds,
  nameInitials,
  parseGeoUri,
  secondsToMinutesAndSeconds,
  splitWithSpace,
  suffixRename,
  trimSlash,
} from './common';

describe('bytesToSize', () => {
  it('handles zero bytes', () => {
    expect(bytesToSize(0)).toBe('0KB');
  });

  it('formats bytes below 1000 as KB (sizeIndex forced to 1)', () => {
    expect(bytesToSize(500)).toBe('0.5 KB');
  });

  it('formats kilobytes, megabytes and gigabytes', () => {
    expect(bytesToSize(1500)).toBe('1.5 KB');
    expect(bytesToSize(1_500_000)).toBe('1.5 MB');
    expect(bytesToSize(1_500_000_000)).toBe('1.5 GB');
  });
});

describe('time formatting helpers', () => {
  it('millisecondsToMinutesAndSeconds pads seconds under 10', () => {
    expect(millisecondsToMinutesAndSeconds(65_000)).toBe('1:05');
  });

  it('millisecondsToMinutesAndSeconds handles durations under a minute', () => {
    expect(millisecondsToMinutesAndSeconds(9_000)).toBe('0:09');
  });

  it('millisecondsToMinutes truncates to whole minutes', () => {
    expect(millisecondsToMinutes(125_000)).toBe('2');
  });

  it('secondsToMinutesAndSeconds pads seconds under 10', () => {
    expect(secondsToMinutesAndSeconds(65)).toBe('1:05');
  });
});

describe('binarySearch', () => {
  const items = [1, 3, 5, 7, 9, 11];
  const matchFor = (target: number) => (item: number) => {
    if (item === target) return 0 as const;
    return item > target ? (1 as const) : (-1 as const);
  };

  it('finds an existing element', () => {
    expect(binarySearch(items, matchFor(7))).toBe(7);
  });

  it('finds the first and last elements', () => {
    expect(binarySearch(items, matchFor(1))).toBe(1);
    expect(binarySearch(items, matchFor(11))).toBe(11);
  });

  it('returns undefined when no element matches', () => {
    expect(binarySearch(items, matchFor(4))).toBeUndefined();
  });

  it('returns undefined for an empty array', () => {
    expect(binarySearch<number>([], matchFor(1))).toBeUndefined();
  });
});

describe('parseGeoUri', () => {
  it('parses a valid geo URI', () => {
    expect(parseGeoUri('geo:37.786971,-122.399677')).toEqual({
      latitude: '37.786971',
      longitude: '-122.399677',
    });
  });

  it('returns undefined for a malformed geo URI', () => {
    expect(parseGeoUri('not-a-geo-uri')).toBeUndefined();
  });
});

describe('trimSlash', () => {
  it('trims leading and trailing slashes', () => {
    expect(trimSlash('///path/to/thing///')).toBe('path/to/thing');
  });

  it('leaves internal slashes untouched', () => {
    expect(trimSlash('/a/b/c/')).toBe('a/b/c');
  });
});

describe('nameInitials', () => {
  it('returns the placeholder glyph for empty/nullish input', () => {
    expect(nameInitials(undefined)).toBe('�');
    expect(nameInitials(null)).toBe('�');
    expect(nameInitials('')).toBe('�');
  });

  it('returns the requested number of leading characters', () => {
    expect(nameInitials('Alice')).toBe('A');
    expect(nameInitials('Alice', 2)).toBe('Al');
  });

  it('handles surrogate-pair characters (e.g. emoji) as single units', () => {
    expect(nameInitials('😀Bob', 1)).toBe('😀');
  });
});

describe('suffixRename', () => {
  it('appends the first suffix that satisfies the validator', () => {
    const taken = new Set(['room1', 'room2']);
    const result = suffixRename('room', (name) => taken.has(name));
    expect(result).toBe('room3');
  });

  it('appends suffix 1 immediately when nothing conflicts', () => {
    const result = suffixRename('room', () => false);
    expect(result).toBe('room1');
  });
});

describe('splitWithSpace', () => {
  it('splits trimmed content on spaces', () => {
    expect(splitWithSpace('  hello   world  ')).toEqual(['hello', '', '', 'world']);
  });

  it('returns an empty array for blank/whitespace-only input', () => {
    expect(splitWithSpace('   ')).toEqual([]);
    expect(splitWithSpace('')).toEqual([]);
  });
});
