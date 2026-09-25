import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MatrixClient } from 'matrix-js-sdk';
import {
  buildRegistrationClientsUrl,
  buildRegistrationInvitesUrl,
  buildRegistrationLinkRequestBody,
  buildRegistrationLinkUrl,
  isOpenIdTokenFresh,
  parseRegistrationClientsResponse,
  parseRegistrationInvitesResponse,
  parseRegistrationLinkResponse,
  requestRegistrationClients,
  requestRegistrationInvites,
  requestRegistrationLink,
} from './registration-bot';

describe('buildRegistrationLinkUrl', () => {
  it('appends the route to the API base URL', () => {
    expect(buildRegistrationLinkUrl('https://bot.example.org')).toBe(
      'https://bot.example.org/api/registration-link'
    );
  });

  it('does not double up a trailing slash', () => {
    expect(buildRegistrationLinkUrl('https://bot.example.org/')).toBe(
      'https://bot.example.org/api/registration-link'
    );
  });
});

describe('buildRegistrationClientsUrl', () => {
  it('has no query when no client is given', () => {
    expect(buildRegistrationClientsUrl('https://bot.example.org')).toBe(
      'https://bot.example.org/api/clients'
    );
  });

  it('encodes client_id into the query', () => {
    expect(buildRegistrationClientsUrl('https://bot.example.org/', 'a b&c')).toBe(
      'https://bot.example.org/api/clients?client_id=a%20b%26c'
    );
  });
});

describe('buildRegistrationInvitesUrl', () => {
  it('has no query for your own invites', () => {
    expect(buildRegistrationInvitesUrl('https://bot.example.org/')).toBe(
      'https://bot.example.org/api/invites'
    );
  });

  it('encodes user_id into the query', () => {
    expect(buildRegistrationInvitesUrl('https://bot.example.org', '@a:b.org')).toBe(
      'https://bot.example.org/api/invites?user_id=%40a%3Ab.org'
    );
  });
});

describe('parseRegistrationInvitesResponse', () => {
  const wireInvite = {
    token_sha256: '9cb4aa',
    status: 'used',
    client_id: 'element',
    issued_at: 1790181986000,
    expires_at: null,
    registered_user_id: '@carol:example.org',
    registered_at: 1790182013010,
  };

  it('parses invites into camelCase', () => {
    expect(parseRegistrationInvitesResponse({ success: true, invites: [wireInvite] })).toEqual({
      success: true,
      invites: [
        {
          tokenSha256: '9cb4aa',
          status: 'used',
          clientId: 'element',
          issuedAt: 1790181986000,
          expiresAt: null,
          registeredUserId: '@carol:example.org',
          registeredAt: 1790182013010,
        },
      ],
    });
  });

  it('treats missing optional fields as null', () => {
    expect(
      parseRegistrationInvitesResponse({
        success: true,
        invites: [{ token_sha256: 'x', status: 'unused' }],
      })
    ).toEqual({
      success: true,
      invites: [
        {
          tokenSha256: 'x',
          status: 'unused',
          clientId: null,
          issuedAt: null,
          expiresAt: null,
          registeredUserId: null,
          registeredAt: null,
        },
      ],
    });
  });

  it('drops malformed or unknown-status entries but keeps the rest', () => {
    const result = parseRegistrationInvitesResponse({
      success: true,
      invites: [
        wireInvite,
        { ...wireInvite, token_sha256: 'y', status: 'someday' },
        { ...wireInvite, token_sha256: 'z', issued_at: 'yesterday' },
        'nope',
      ],
    });
    expect(result.success && result.invites.map((i) => i.tokenSha256)).toEqual(['9cb4aa']);
  });

  it("passes on the bot's refusal", () => {
    expect(
      parseRegistrationInvitesResponse({
        success: false,
        error: { code: 'upstream_error', message: 'module missing' },
      })
    ).toEqual({ success: false, error: { code: 'upstream_error', message: 'module missing' } });
  });

  it('falls back to a generic message', () => {
    expect(parseRegistrationInvitesResponse({ success: true })).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not list invites.' },
    });
  });
});

describe('buildRegistrationLinkRequestBody', () => {
  it('is empty when no client is given', () => {
    expect(buildRegistrationLinkRequestBody({})).toEqual({});
  });

  it('includes client_id when given', () => {
    expect(buildRegistrationLinkRequestBody({ clientId: 'web' })).toEqual({ client_id: 'web' });
  });
});

describe('isOpenIdTokenFresh', () => {
  it('is false with no cached token', () => {
    expect(isOpenIdTokenFresh(undefined, 0)).toBe(false);
  });

  it('is true well before expiry', () => {
    expect(isOpenIdTokenFresh({ accessToken: 't', expiresAt: 3600000 }, 0)).toBe(true);
  });

  it('is false within the last minute before expiry', () => {
    expect(isOpenIdTokenFresh({ accessToken: 't', expiresAt: 3600000 }, 3550000)).toBe(false);
  });
});

describe('parseRegistrationLinkResponse', () => {
  it('parses a successful response', () => {
    expect(
      parseRegistrationLinkResponse({
        success: true,
        link: 'https://app.example.org/?register_token=syt_abc',
        token: 'syt_abc',
        client_id: 'web',
      })
    ).toEqual({
      success: true,
      link: 'https://app.example.org/?register_token=syt_abc',
      token: 'syt_abc',
      clientId: 'web',
    });
  });

  it('parses a failure response with an error code and message', () => {
    expect(
      parseRegistrationLinkResponse({
        success: false,
        error: { code: 'quota_exceeded', message: 'too many links' },
      })
    ).toEqual({
      success: false,
      error: { code: 'quota_exceeded', message: 'too many links' },
    });
  });

  it('falls back to a generic message when success is false and error is malformed', () => {
    expect(parseRegistrationLinkResponse({ success: false })).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not create a link.' },
    });
  });

  it('treats a response claiming success without a link as a failure', () => {
    expect(parseRegistrationLinkResponse({ success: true })).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not create a link.' },
    });
  });

  it('treats a non-object body as a failure', () => {
    expect(parseRegistrationLinkResponse(undefined)).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not create a link.' },
    });
  });
});

describe('parseRegistrationClientsResponse', () => {
  it('parses a successful response with a list of clients', () => {
    expect(
      parseRegistrationClientsResponse({
        success: true,
        clients: [
          { id: 'web', base_url: 'https://app.example.org' },
          { id: 'mobile', base_url: 'https://mobile.example.org' },
        ],
      })
    ).toEqual({
      success: true,
      clients: [
        { id: 'web', baseUrl: 'https://app.example.org' },
        { id: 'mobile', baseUrl: 'https://mobile.example.org' },
      ],
    });
  });

  it('parses a failure response with an error code and message', () => {
    expect(
      parseRegistrationClientsResponse({
        success: false,
        error: { code: 'not_found', message: "no client 'web' is configured" },
      })
    ).toEqual({
      success: false,
      error: { code: 'not_found', message: "no client 'web' is configured" },
    });
  });

  it('falls back to a generic message when success is false and error is malformed', () => {
    expect(parseRegistrationClientsResponse({ success: false })).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not list clients.' },
    });
  });

  it('treats a response claiming success without a clients array as a failure', () => {
    expect(parseRegistrationClientsResponse({ success: true })).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not list clients.' },
    });
  });

  it('treats a response with a malformed client entry as a failure', () => {
    expect(
      parseRegistrationClientsResponse({
        success: true,
        clients: [{ id: 'web' }],
      })
    ).toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not list clients.' },
    });
  });
});

describe('requesting over HTTP', () => {
  const botConfig = { apiUrl: 'https://bot.example.org' };

  const fakeClient = (...tokens: string[]) => {
    const getOpenIdToken = vi.fn();
    tokens.forEach((token) =>
      getOpenIdToken.mockResolvedValueOnce({
        access_token: token,
        token_type: 'Bearer',
        matrix_server_name: 'example.org',
        expires_in: 3600,
      })
    );
    return { mx: { getOpenIdToken } as unknown as MatrixClient, getOpenIdToken };
  };

  const jsonResponse = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mints a link with the OpenID access token as a bearer token', async () => {
    const { mx } = fakeClient('openid-1');
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        success: true,
        link: 'https://app.example.org/?register_token=t',
        token: 't',
        client_id: 'web',
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestRegistrationLink(mx, botConfig, 'web')).resolves.toEqual({
      success: true,
      link: 'https://app.example.org/?register_token=t',
      token: 't',
      clientId: 'web',
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://bot.example.org/api/registration-link');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer openid-1');
    expect(JSON.parse(init.body)).toEqual({ client_id: 'web' });
  });

  it('reuses a fresh OpenID token across requests', async () => {
    const { mx, getOpenIdToken } = fakeClient('openid-1');
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonResponse(200, { success: true, clients: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await requestRegistrationClients(mx, botConfig);
    await requestRegistrationClients(mx, botConfig);

    expect(getOpenIdToken).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[1][0]).toBe('https://bot.example.org/api/clients');
  });

  it('retries once with a new token after a 401', async () => {
    const { mx, getOpenIdToken } = fakeClient('stale', 'fresh');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(401, {
          success: false,
          error: { code: 'unauthorized', message: 'the token is not valid' },
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { success: true, clients: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestRegistrationClients(mx, botConfig)).resolves.toEqual({
      success: true,
      clients: [],
    });
    expect(getOpenIdToken).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer fresh');
  });

  it('lists invites with a GET to /api/invites', async () => {
    const { mx } = fakeClient('openid-1');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { success: true, invites: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(requestRegistrationInvites(mx, botConfig)).resolves.toEqual({
      success: true,
      invites: [],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://bot.example.org/api/invites');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer openid-1');
  });

  it("surfaces the bot's refusal", async () => {
    const { mx } = fakeClient('openid-1');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(403, {
          success: false,
          error: { code: 'quota_exceeded', message: 'too many links' },
        })
      )
    );

    await expect(requestRegistrationLink(mx, botConfig)).resolves.toEqual({
      success: false,
      error: { code: 'quota_exceeded', message: 'too many links' },
    });
  });

  it('treats a non-JSON answer as a failure', async () => {
    const { mx } = fakeClient('openid-1');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 })));

    await expect(requestRegistrationLink(mx, botConfig)).resolves.toEqual({
      success: false,
      error: { code: undefined, message: 'The registration bot could not create a link.' },
    });
  });
});
