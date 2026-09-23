import { describe, expect, it } from 'vitest';
import { Room } from 'matrix-js-sdk';
import {
  createCommunityChildRoomOptions,
  createCommunitySpaceOptions,
  CreateCommunityData,
  getCommunityChildJoinRule,
  getPostsRoomName,
  isCommunitySynced,
} from './createCommunity';
import { isPostsRoomName } from '../app-feed/findPostsRoom';

const data = (overrides: Partial<CreateCommunityData> = {}): CreateCommunityData => ({
  name: 'Grace Church',
  visibility: 'private',
  roomVersion: '10',
  ...overrides,
});

describe('getPostsRoomName', () => {
  it('slugifies the community name and adds the posts suffix', () => {
    expect(getPostsRoomName('Grace Church')).toBe('grace-church-posts');
    expect(getPostsRoomName("  St. Mark's  Youth! ")).toBe('st-mark-s-youth-posts');
  });

  it('keeps non-latin letters', () => {
    expect(getPostsRoomName('Iglesia Señor')).toBe('iglesia-señor-posts');
  });

  it('falls back when the name has no letters or digits', () => {
    expect(getPostsRoomName('!!!')).toBe('community-posts');
  });

  it('is recognised by the feed as a posts room', () => {
    expect(isPostsRoomName(getPostsRoomName('Grace Church'))).toBe(true);
  });
});

describe('getCommunityChildJoinRule', () => {
  it('makes rooms of public communities public', () => {
    expect(getCommunityChildJoinRule('public', '!s:x', '10')).toEqual({ join_rule: 'public' });
  });

  it('restricts rooms of private communities to members', () => {
    expect(getCommunityChildJoinRule('private', '!s:x', '10')).toEqual({
      join_rule: 'restricted',
      allow: [{ type: 'm.room_membership', room_id: '!s:x' }],
    });
    expect(getCommunityChildJoinRule('private', '!s:x', undefined).join_rule).toBe('restricted');
  });

  it('falls back to invite-only when restricted rooms are unsupported', () => {
    expect(getCommunityChildJoinRule('private', '!s:x', '6')).toEqual({ join_rule: 'invite' });
  });
});

describe('createCommunitySpaceOptions', () => {
  it('creates an invite-only space for private communities', () => {
    const opts = createCommunitySpaceOptions(data({ description: '  hi  ' }));
    expect(opts.name).toBe('Grace Church');
    expect(opts.topic).toBe('hi');
    expect(opts.room_version).toBe('10');
    expect(opts.creation_content).toEqual({ type: 'm.space' });
    expect(opts.initial_state).toEqual([
      { type: 'm.room.join_rules', state_key: '', content: { join_rule: 'invite' } },
    ]);
  });

  it('creates a public, world-readable space for public communities', () => {
    const opts = createCommunitySpaceOptions(data({ visibility: 'public', description: ' ' }));
    expect(opts.topic).toBeUndefined();
    expect(opts.initial_state).toEqual([
      { type: 'm.room.join_rules', state_key: '', content: { join_rule: 'public' } },
      {
        type: 'm.room.history_visibility',
        state_key: '',
        content: { history_visibility: 'world_readable' },
      },
    ]);
  });
});

describe('createCommunityChildRoomOptions', () => {
  it('links the room to its community', () => {
    const opts = createCommunityChildRoomOptions(data(), '!s:x', 'grace-church-posts', ['x']);
    expect(opts.name).toBe('grace-church-posts');
    expect(opts.initial_state).toEqual([
      { type: 'm.space.parent', state_key: '!s:x', content: { canonical: true, via: ['x'] } },
      {
        type: 'm.room.join_rules',
        state_key: '',
        content: getCommunityChildJoinRule('private', '!s:x', '10'),
      },
    ]);
  });
});

describe('isCommunitySynced', () => {
  const result = { spaceId: '!s:x', postsRoomId: '!p:x', chatRoomId: '!c:x' };
  const space = { roomId: '!s:x' } as Room;
  const posts = { roomId: '!p:x' } as Room;
  const rooms =
    (...list: Room[]) =>
    (id: string) =>
      list.find((room) => room.roomId === id);

  it('waits for the space and posts room to be joined', () => {
    expect(isCommunitySynced(result, rooms(), () => ['!p:x'])).toBe(false);
    expect(isCommunitySynced(result, rooms(space), () => ['!p:x'])).toBe(false);
  });

  it('waits for the posts room to be listed as a child', () => {
    expect(isCommunitySynced(result, rooms(space, posts), () => [])).toBe(false);
    expect(isCommunitySynced(result, rooms(space, posts), () => ['!p:x'])).toBe(true);
  });
});
