import { describe, expect, it, vi } from 'vitest';
import { AutoDiscoveryAction, autoDiscovery, specVersions } from './cs-api';

const jsonResponse = (status: number, body: unknown) =>
  ({
    status,
    json: () => Promise.resolve(body),
  } as Response);

describe('autoDiscovery', () => {
  it('prefixes a bare hostname with https://', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(404, {}));
    await autoDiscovery(request, 'matrix.org');
    expect(request).toHaveBeenCalledWith(
      'https://matrix.org/.well-known/matrix/client',
      expect.anything()
    );
  });

  it('keeps an explicit scheme and trims a trailing slash', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(404, {}));
    await autoDiscovery(request, 'http://matrix.example.org/');
    expect(request).toHaveBeenCalledWith(
      'http://matrix.example.org/.well-known/matrix/client',
      expect.anything()
    );
  });

  it('falls back to the host itself (IGNORE) when the request rejects', async () => {
    const request = vi.fn().mockRejectedValue(new Error('network down'));
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(err).toBeUndefined();
    expect(info).toEqual({ 'm.homeserver': { base_url: 'https://matrix.org' } });
  });

  it('falls back to the host itself (IGNORE) on a 404', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(404, {}));
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(err).toBeUndefined();
    expect(info).toEqual({ 'm.homeserver': { base_url: 'https://matrix.org' } });
  });

  it('FAIL_PROMPTs on a non-200, non-404 response', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(500, {}));
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(info).toBeUndefined();
    expect(err).toEqual({ host: 'https://matrix.org', action: AutoDiscoveryAction.FAIL_PROMPT });
  });

  it('FAIL_PROMPTs when the response body is not valid JSON', async () => {
    const request = vi.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.reject(new Error('bad json')),
    } as unknown as Response);
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(info).toBeUndefined();
    expect(err?.action).toBe(AutoDiscoveryAction.FAIL_PROMPT);
  });

  it('FAIL_PROMPTs when the response body is not an object', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(200, 'just a string'));
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(info).toBeUndefined();
    expect(err?.action).toBe(AutoDiscoveryAction.FAIL_PROMPT);
  });

  it('FAIL_PROMPTs when m.homeserver.base_url is missing', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(200, { 'm.homeserver': {} }));
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(info).toBeUndefined();
    expect(err?.action).toBe(AutoDiscoveryAction.FAIL_PROMPT);
  });

  it('FAIL_ERRORs when base_url has no http(s) scheme', async () => {
    const request = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        'm.homeserver': { base_url: 'ftp://matrix.example.org' },
      })
    );
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(info).toBeUndefined();
    expect(err).toEqual({
      host: 'https://matrix.org',
      action: AutoDiscoveryAction.FAIL_ERROR,
    });
  });

  it('returns the discovered info and trims trailing slashes from base_urls', async () => {
    const request = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        'm.homeserver': { base_url: 'https://matrix.example.org/' },
        'm.identity_server': { base_url: 'https://identity.example.org/' },
      })
    );
    const [err, info] = await autoDiscovery(request, 'matrix.org');
    expect(err).toBeUndefined();
    expect(info?.['m.homeserver'].base_url).toBe('https://matrix.example.org');
    expect(info?.['m.identity_server']?.base_url).toBe('https://identity.example.org');
  });
});

describe('specVersions', () => {
  it('requests the versions endpoint with a trimmed base URL', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(200, { versions: ['v1.1'] }));
    await specVersions(request, 'https://matrix.example.org/');
    expect(request).toHaveBeenCalledWith('https://matrix.example.org/_matrix/client/versions');
  });

  it('returns the parsed body when it has a versions array', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(200, { versions: ['v1.1', 'v1.2'] }));
    const result = await specVersions(request, 'https://matrix.example.org');
    expect(result).toEqual({ versions: ['v1.1', 'v1.2'] });
  });

  it('throws when the body has no versions array', async () => {
    const request = vi.fn().mockResolvedValue(jsonResponse(200, { not_versions: [] }));
    await expect(specVersions(request, 'https://matrix.example.org')).rejects.toThrow(
      'Homeserver URL does not appear to be a valid Matrix homeserver'
    );
  });
});
