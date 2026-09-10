import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFallbackSession, removeFallbackSession, setFallbackSession } from './sessions';

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

describe('setFallbackSession / getFallbackSession', () => {
  it('round-trips a full session through localStorage', () => {
    setFallbackSession('token123', 'DEVICE1', '@alice:example.org', 'https://matrix.example.org');

    expect(getFallbackSession()).toEqual({
      baseUrl: 'https://matrix.example.org',
      userId: '@alice:example.org',
      deviceId: 'DEVICE1',
      accessToken: 'token123',
      fallbackSdkStores: true,
    });
  });

  it('returns undefined when nothing has been stored', () => {
    expect(getFallbackSession()).toBeUndefined();
  });

  it('returns undefined when only part of the session is present', () => {
    setFallbackSession('token123', 'DEVICE1', '@alice:example.org', 'https://matrix.example.org');
    localStorage.removeItem('cinny_device_id');

    expect(getFallbackSession()).toBeUndefined();
  });
});

describe('removeFallbackSession', () => {
  it('clears a previously stored session', () => {
    setFallbackSession('token123', 'DEVICE1', '@alice:example.org', 'https://matrix.example.org');
    removeFallbackSession();

    expect(getFallbackSession()).toBeUndefined();
    expect(localStorage.getItem('cinny_access_token')).toBeNull();
  });
});
