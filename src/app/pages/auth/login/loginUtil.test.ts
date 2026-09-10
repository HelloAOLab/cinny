import { MatrixError } from 'matrix-js-sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientConfig } from '../../../hooks/useClientConfig';
import { ErrorCode } from '../../../cs-errorcode';
import { GetBaseUrlError, LoginError, factoryGetBaseUrl, login } from './loginUtil';

const { loginRequestMock, createClientMock, autoDiscoveryMock, specVersionsMock } = vi.hoisted(
  () => {
    const hoistedLoginRequestMock = vi.fn();
    return {
      loginRequestMock: hoistedLoginRequestMock,
      createClientMock: vi.fn(() => ({ loginRequest: hoistedLoginRequestMock })),
      autoDiscoveryMock: vi.fn(),
      specVersionsMock: vi.fn(),
    };
  }
);

vi.mock('matrix-js-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('matrix-js-sdk')>();
  return {
    ...actual,
    createClient: createClientMock,
  };
});

vi.mock('../../../cs-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../cs-api')>();
  return {
    ...actual,
    autoDiscovery: autoDiscoveryMock,
    specVersions: specVersionsMock,
  };
});

beforeEach(() => {
  loginRequestMock.mockReset();
  createClientMock.mockClear();
  autoDiscoveryMock.mockReset();
  specVersionsMock.mockReset();
});

const allowAllConfig: ClientConfig = { allowCustomHomeservers: true };
const allowlistConfig: ClientConfig = {
  allowCustomHomeservers: false,
  homeserverList: ['matrix.org'],
};

describe('factoryGetBaseUrl', () => {
  it('rejects a server that is not in the configured allowlist', async () => {
    const getBaseUrl = factoryGetBaseUrl(allowlistConfig, 'evil.example.org');
    await expect(getBaseUrl()).rejects.toThrow(GetBaseUrlError.NotAllow);
    expect(autoDiscoveryMock).not.toHaveBeenCalled();
  });

  it('resolves the base URL discovered via .well-known + spec versions', async () => {
    autoDiscoveryMock.mockResolvedValue([
      undefined,
      { 'm.homeserver': { base_url: 'https://matrix.example.org' } },
    ]);
    specVersionsMock.mockResolvedValue({ versions: ['v1.1'] });

    const getBaseUrl = factoryGetBaseUrl(allowAllConfig, 'matrix.example.org');
    await expect(getBaseUrl()).resolves.toBe('https://matrix.example.org');
  });

  it('rejects with NotFound when auto-discovery fails', async () => {
    autoDiscoveryMock.mockResolvedValue([{ host: 'x', action: 'FAIL_PROMPT' }, undefined]);

    const getBaseUrl = factoryGetBaseUrl(allowAllConfig, 'matrix.example.org');
    await expect(getBaseUrl()).rejects.toThrow(GetBaseUrlError.NotFound);
    expect(specVersionsMock).not.toHaveBeenCalled();
  });

  it('rejects with NotFound when the discovered server has no usable spec versions', async () => {
    autoDiscoveryMock.mockResolvedValue([
      undefined,
      { 'm.homeserver': { base_url: 'https://matrix.example.org' } },
    ]);
    specVersionsMock.mockRejectedValue(new Error('not a homeserver'));

    const getBaseUrl = factoryGetBaseUrl(allowAllConfig, 'matrix.example.org');
    await expect(getBaseUrl()).rejects.toThrow(GetBaseUrlError.NotFound);
  });
});

describe('login', () => {
  it('logs in against a plain string base URL and returns the response', async () => {
    const response = {
      access_token: 'tok',
      device_id: 'DEV1',
      user_id: '@alice:example.org',
    };
    loginRequestMock.mockResolvedValue(response);

    const result = await login('https://matrix.example.org', {
      type: 'm.login.password',
      identifier: { type: 'm.id.user', user: 'alice' },
      password: 'hunter2',
    });

    expect(createClientMock).toHaveBeenCalledWith({ baseUrl: 'https://matrix.example.org' });
    expect(result).toEqual({ baseUrl: 'https://matrix.example.org', response });
  });

  it('resolves a function base URL before creating the client', async () => {
    loginRequestMock.mockResolvedValue({});
    const getBaseUrl = vi.fn().mockResolvedValue('https://resolved.example.org');

    await login(getBaseUrl, {
      type: 'm.login.password',
      identifier: { type: 'm.id.user', user: 'alice' },
      password: 'hunter2',
    });

    expect(getBaseUrl).toHaveBeenCalled();
    expect(createClientMock).toHaveBeenCalledWith({ baseUrl: 'https://resolved.example.org' });
  });

  it('maps a NotAllow base-url failure to ServerNotAllowed', async () => {
    const getBaseUrl = vi.fn().mockRejectedValue(new Error(GetBaseUrlError.NotAllow));

    await expect(
      login(getBaseUrl, {
        type: 'm.login.password',
        identifier: { type: 'm.id.user', user: 'alice' },
        password: 'hunter2',
      })
    ).rejects.toMatchObject({ errcode: LoginError.ServerNotAllowed });
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('maps any other base-url failure to InvalidServer', async () => {
    const getBaseUrl = vi.fn().mockRejectedValue(new Error(GetBaseUrlError.NotFound));

    await expect(
      login(getBaseUrl, {
        type: 'm.login.password',
        identifier: { type: 'm.id.user', user: 'alice' },
        password: 'hunter2',
      })
    ).rejects.toMatchObject({ errcode: LoginError.InvalidServer });
  });

  it('maps HTTP 400 to InvalidRequest', async () => {
    loginRequestMock.mockRejectedValue(new MatrixError({}, 400));

    await expect(
      login('https://matrix.example.org', {
        type: 'm.login.password',
        identifier: { type: 'm.id.user', user: 'alice' },
        password: 'hunter2',
      })
    ).rejects.toMatchObject({ errcode: LoginError.InvalidRequest });
  });

  it('maps HTTP 429 to RateLimited', async () => {
    loginRequestMock.mockRejectedValue(new MatrixError({}, 429));

    await expect(
      login('https://matrix.example.org', {
        type: 'm.login.password',
        identifier: { type: 'm.id.user', user: 'alice' },
        password: 'hunter2',
      })
    ).rejects.toMatchObject({ errcode: LoginError.RateLimited });
  });

  it('maps M_USER_DEACTIVATED to UserDeactivated', async () => {
    loginRequestMock.mockRejectedValue(
      new MatrixError({ errcode: ErrorCode.M_USER_DEACTIVATED }, 403)
    );

    await expect(
      login('https://matrix.example.org', {
        type: 'm.login.password',
        identifier: { type: 'm.id.user', user: 'alice' },
        password: 'hunter2',
      })
    ).rejects.toMatchObject({ errcode: LoginError.UserDeactivated });
  });

  it('maps a plain HTTP 403 (wrong password) to Forbidden', async () => {
    loginRequestMock.mockRejectedValue(new MatrixError({ errcode: 'M_FORBIDDEN' }, 403));

    await expect(
      login('https://matrix.example.org', {
        type: 'm.login.password',
        identifier: { type: 'm.id.user', user: 'alice' },
        password: 'hunter2',
      })
    ).rejects.toMatchObject({ errcode: LoginError.Forbidden });
  });

  it('maps any other failure to Unknown', async () => {
    loginRequestMock.mockRejectedValue(new MatrixError({}, 500));

    await expect(
      login('https://matrix.example.org', {
        type: 'm.login.password',
        identifier: { type: 'm.id.user', user: 'alice' },
        password: 'hunter2',
      })
    ).rejects.toMatchObject({ errcode: LoginError.Unknown });
  });
});
