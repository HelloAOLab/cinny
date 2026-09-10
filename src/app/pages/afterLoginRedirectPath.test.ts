import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteAfterLoginRedirectPath,
  getAfterLoginRedirectPath,
  setAfterLoginRedirectPath,
} from './afterLoginRedirectPath';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
});

describe('afterLoginRedirectPath', () => {
  it('returns undefined when no redirect path was set', () => {
    expect(getAfterLoginRedirectPath()).toBeUndefined();
  });

  it('round-trips a stored redirect path', () => {
    setAfterLoginRedirectPath('/home/room/!abc:example.org');
    expect(getAfterLoginRedirectPath()).toBe('/home/room/!abc:example.org');
  });

  it('clears the stored redirect path on delete', () => {
    setAfterLoginRedirectPath('/home/room/!abc:example.org');
    deleteAfterLoginRedirectPath();
    expect(getAfterLoginRedirectPath()).toBeUndefined();
  });
});
