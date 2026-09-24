import { describe, expect, it } from 'vitest';
import {
  getAppCommunityChatPath,
  getAppCommunityChatRoomPath,
  getAppInboxPath,
  getLoginPathForRedirect,
  getSpaceFeedPath,
} from './pathUtils';

describe('getSpaceFeedPath', () => {
  it('builds a feed path scoped to the given space', () => {
    expect(getSpaceFeedPath('!space:example.org')).toBe('/!space%3Aexample.org/feed');
  });

  it('encodes a space alias', () => {
    expect(getSpaceFeedPath('#space:example.org')).toBe('/%23space%3Aexample.org/feed');
  });
});

describe('getAppCommunityChatPath', () => {
  it('builds the chat list path for a community', () => {
    expect(getAppCommunityChatPath('!space:example.org')).toBe('/app/!space%3Aexample.org/chat');
  });
});

describe('getAppCommunityChatRoomPath', () => {
  it('builds a chat room path scoped to a community', () => {
    expect(getAppCommunityChatRoomPath('!space:example.org', '#general:example.org')).toBe(
      '/app/!space%3Aexample.org/chat/%23general%3Aexample.org'
    );
  });
});

describe('getAppInboxPath', () => {
  it('builds the inbox path scoped to a community', () => {
    expect(getAppInboxPath('!space:example.org')).toBe('/app/!space%3Aexample.org/inbox');
  });

  it('falls back to the unscoped inbox path without a community', () => {
    expect(getAppInboxPath()).toBe('/app/inbox/');
  });
});

describe('getLoginPathForRedirect', () => {
  it('defaults to the /app login when there is no redirect path', () => {
    expect(getLoginPathForRedirect()).toBe('/app/login');
    expect(getLoginPathForRedirect('/')).toBe('/app/login');
    expect(getLoginPathForRedirect('/?foo=bar')).toBe('/app/login');
  });

  it('uses the /app login for /app paths', () => {
    expect(getLoginPathForRedirect('/app/!space%3Aexample.org/chat')).toBe('/app/login');
  });

  it('uses the legacy login for legacy client paths', () => {
    expect(getLoginPathForRedirect('/home/')).toBe('/login');
    expect(getLoginPathForRedirect('/direct/')).toBe('/login');
  });
});
