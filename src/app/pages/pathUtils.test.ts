import { describe, expect, it } from 'vitest';
import {
  getAppCommunityChatPath,
  getAppCommunityChatRoomPath,
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
