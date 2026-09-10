import { describe, expect, it } from 'vitest';
import { ClientConfig, clientAllowedServer, clientDefaultServer } from './useClientConfig';

describe('clientAllowedServer', () => {
  it('allows any server when allowCustomHomeservers is true, regardless of the list', () => {
    const config: ClientConfig = {
      allowCustomHomeservers: true,
      homeserverList: ['matrix.org'],
    };
    expect(clientAllowedServer(config, 'evil.example.org')).toBe(true);
  });

  it('allows a server present in homeserverList when custom homeservers are disallowed', () => {
    const config: ClientConfig = {
      allowCustomHomeservers: false,
      homeserverList: ['matrix.org', 'example.org'],
    };
    expect(clientAllowedServer(config, 'example.org')).toBe(true);
  });

  it('rejects a server not present in homeserverList when custom homeservers are disallowed', () => {
    const config: ClientConfig = {
      allowCustomHomeservers: false,
      homeserverList: ['matrix.org'],
    };
    expect(clientAllowedServer(config, 'evil.example.org')).toBe(false);
  });

  it('rejects any server when homeserverList and allowCustomHomeservers are both unset', () => {
    const config: ClientConfig = {};
    expect(clientAllowedServer(config, 'matrix.org')).toBe(false);
  });
});

describe('clientDefaultServer', () => {
  it('returns the server at defaultHomeserver index', () => {
    const config: ClientConfig = {
      homeserverList: ['matrix.org', 'example.org'],
      defaultHomeserver: 1,
    };
    expect(clientDefaultServer(config)).toBe('example.org');
  });

  it('defaults to index 0 when defaultHomeserver is unset', () => {
    const config: ClientConfig = {
      homeserverList: ['matrix.org', 'example.org'],
    };
    expect(clientDefaultServer(config)).toBe('matrix.org');
  });

  it('falls back to matrix.org when no homeserverList is configured', () => {
    expect(clientDefaultServer({})).toBe('matrix.org');
  });
});
