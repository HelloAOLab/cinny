import { describe, expect, test } from 'vitest';
import { relativeTime } from './time';

describe('relativeTime', () => {
  const now = new Date('2024-01-10T12:00:00.000Z').getTime();

  test('formats seconds in the past', () => {
    expect(relativeTime(now - 30 * 1000, now)).toBe('30 seconds ago');
  });

  test('formats "now" for sub-second differences', () => {
    expect(relativeTime(now - 500, now)).toBe('now');
  });

  test('formats minutes in the past', () => {
    expect(relativeTime(now - 10 * 60 * 1000, now)).toBe('10 minutes ago');
  });

  test('formats hours in the past', () => {
    expect(relativeTime(now - 3 * 60 * 60 * 1000, now)).toBe('3 hours ago');
  });

  test('formats days in the past', () => {
    expect(relativeTime(now - 2 * 24 * 60 * 60 * 1000, now)).toBe('2 days ago');
  });

  test('formats a future timestamp', () => {
    expect(relativeTime(now + 5 * 60 * 1000, now)).toBe('in 5 minutes');
  });

  test('supports a narrow style', () => {
    expect(relativeTime(now - 2 * 24 * 60 * 60 * 1000, now, 'narrow')).toBe('2d ago');
  });
});
