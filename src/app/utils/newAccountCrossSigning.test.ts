import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthDict, MatrixClient, MatrixError } from 'matrix-js-sdk';
import {
  bootstrapNewAccountCrossSigning,
  clearPendingCrossSigning,
  isCrossSigningPendingFor,
  makeNewAccountSigningKeysAuth,
  markNewAccountForCrossSigning,
} from './newAccountCrossSigning';

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

const USER_ID = '@alice:example.org';

const uiaError = () =>
  new MatrixError({ session: 'sess1', flows: [{ stages: ['m.login.password'] }] }, 401);

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
  clearPendingCrossSigning();
});

describe('markNewAccountForCrossSigning', () => {
  it('marks only the given account as pending until cleared', () => {
    markNewAccountForCrossSigning(USER_ID);
    expect(isCrossSigningPendingFor(USER_ID)).toBe(true);
    expect(isCrossSigningPendingFor('@bob:example.org')).toBe(false);

    clearPendingCrossSigning();
    expect(isCrossSigningPendingFor(USER_ID)).toBe(false);
  });
});

describe('makeNewAccountSigningKeysAuth', () => {
  it('uploads without auth when the server allows it', async () => {
    const makeRequest = vi.fn<(auth: AuthDict | null) => Promise<void>>(async () => undefined);
    await makeNewAccountSigningKeysAuth(USER_ID, 'pw')(makeRequest);
    expect(makeRequest).toHaveBeenCalledTimes(1);
    expect(makeRequest).toHaveBeenCalledWith(null);
  });

  it('retries with the password when the server asks for auth', async () => {
    const makeRequest = vi
      .fn<(auth: AuthDict | null) => Promise<void>>()
      .mockRejectedValueOnce(uiaError())
      .mockResolvedValueOnce(undefined);
    await makeNewAccountSigningKeysAuth(USER_ID, 'pw')(makeRequest);
    expect(makeRequest).toHaveBeenLastCalledWith({
      type: 'm.login.password',
      identifier: { type: 'm.id.user', user: USER_ID },
      password: 'pw',
      session: 'sess1',
    });
  });

  it('gives up when auth is needed and there is no password', async () => {
    const makeRequest = vi.fn(async () => {
      throw uiaError();
    });
    await expect(makeNewAccountSigningKeysAuth(USER_ID)(makeRequest)).rejects.toThrow();
    expect(makeRequest).toHaveBeenCalledTimes(1);
  });
});

describe('bootstrapNewAccountCrossSigning', () => {
  const makeClient = (hasKeys: boolean, bootstrap = vi.fn(async () => undefined)) => {
    const crypto = {
      userHasCrossSigningKeys: vi.fn(async () => hasKeys),
      bootstrapCrossSigning: bootstrap,
    };
    const mx = {
      getSafeUserId: () => USER_ID,
      getCrypto: () => crypto,
    } as unknown as MatrixClient;
    return { mx, crypto };
  };

  it('does nothing for accounts not registered here', async () => {
    const { mx, crypto } = makeClient(false);
    await bootstrapNewAccountCrossSigning(mx);
    expect(crypto.bootstrapCrossSigning).not.toHaveBeenCalled();
  });

  it('sets up cross-signing for a new account, once', async () => {
    markNewAccountForCrossSigning(USER_ID, 'pw');
    const { mx, crypto } = makeClient(false);
    await bootstrapNewAccountCrossSigning(mx);
    expect(crypto.bootstrapCrossSigning).toHaveBeenCalledTimes(1);
    expect(isCrossSigningPendingFor(USER_ID)).toBe(false);

    await bootstrapNewAccountCrossSigning(mx);
    expect(crypto.bootstrapCrossSigning).toHaveBeenCalledTimes(1);
  });

  it('never replaces an existing identity', async () => {
    markNewAccountForCrossSigning(USER_ID);
    const { mx, crypto } = makeClient(true);
    await bootstrapNewAccountCrossSigning(mx);
    expect(crypto.bootstrapCrossSigning).not.toHaveBeenCalled();
    expect(isCrossSigningPendingFor(USER_ID)).toBe(false);
  });

  it('stops trying when auth is rejected, but retries after other errors', async () => {
    markNewAccountForCrossSigning(USER_ID);
    const network = makeClient(
      false,
      vi.fn(async () => {
        throw new Error('network');
      })
    );
    await expect(bootstrapNewAccountCrossSigning(network.mx)).rejects.toThrow('network');
    expect(isCrossSigningPendingFor(USER_ID)).toBe(true);

    const rejected = makeClient(
      false,
      vi.fn(async () => {
        throw uiaError();
      })
    );
    await expect(bootstrapNewAccountCrossSigning(rejected.mx)).rejects.toThrow();
    expect(isCrossSigningPendingFor(USER_ID)).toBe(false);
  });
});
