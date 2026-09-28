import { describe, expect, it } from 'vitest';
import { IHierarchyRoom } from 'matrix-js-sdk/lib/@types/spaces';
import { getMessagePreview, getUnjoinedChatRooms, resolveReplacedRooms } from './chatRooms';

describe('getMessagePreview', () => {
  it('returns the body of a text message', () => {
    expect(
      getMessagePreview({ type: 'm.room.message', content: { msgtype: 'm.text', body: 'hello' } })
    ).toBe('hello');
  });

  it('collapses whitespace and strips reply fallbacks', () => {
    expect(
      getMessagePreview({
        type: 'm.room.message',
        content: {
          msgtype: 'm.text',
          body: '> <@alice:example.org> original\n\nmy   reply\nsecond line',
        },
      })
    ).toBe('my reply second line');
  });

  it('labels media messages', () => {
    expect(
      getMessagePreview({ type: 'm.room.message', content: { msgtype: 'm.image', body: 'a.png' } })
    ).toBe('Photo');
    expect(
      getMessagePreview({ type: 'm.room.message', content: { msgtype: 'm.file', body: 'a.pdf' } })
    ).toBe('File');
  });

  it('labels encrypted messages and stickers', () => {
    expect(getMessagePreview({ type: 'm.room.encrypted', content: {} })).toBe('Encrypted message');
    expect(getMessagePreview({ type: 'm.sticker', content: { body: 'cat' } })).toBe('Sticker');
  });

  it('skips non-message events and redacted messages', () => {
    expect(getMessagePreview({ type: 'm.room.name', content: { name: 'x' } })).toBeUndefined();
    expect(getMessagePreview({ type: 'm.room.message', content: {} })).toBeUndefined();
  });
});

const hierarchyRoom = (overrides: Partial<IHierarchyRoom>): IHierarchyRoom => ({
  room_id: '!room:example.org',
  world_readable: false,
  guest_can_join: false,
  num_joined_members: 1,
  children_state: [],
  ...overrides,
});

describe('getUnjoinedChatRooms', () => {
  const spaceId = '!space:example.org';

  it('returns unjoined non-space rooms with via servers from the parent', () => {
    const rooms = [
      hierarchyRoom({
        room_id: spaceId,
        room_type: 'm.space',
        children_state: [
          {
            type: 'm.space.child',
            state_key: '!general:example.org',
            sender: '@admin:example.org',
            origin_server_ts: 0,
            content: { via: ['example.org'] },
          },
        ],
      }),
      hierarchyRoom({ room_id: '!general:example.org', name: 'General', num_joined_members: 5 }),
      hierarchyRoom({ room_id: '!joined:example.org', name: 'Joined' }),
      hierarchyRoom({ room_id: '!sub:example.org', room_type: 'm.space', name: 'Sub space' }),
    ];

    expect(
      getUnjoinedChatRooms(spaceId, rooms, (roomId) => roomId === '!joined:example.org')
    ).toEqual([
      {
        roomId: '!general:example.org',
        name: 'General',
        topic: undefined,
        avatarUrl: undefined,
        memberCount: 5,
        via: ['example.org'],
      },
    ]);
  });

  it('falls back to alias then id for the name', () => {
    const rooms = [
      hierarchyRoom({ room_id: '!a:example.org', canonical_alias: '#a:example.org' }),
      hierarchyRoom({ room_id: '!b:example.org' }),
    ];
    expect(getUnjoinedChatRooms(spaceId, rooms, () => false).map((room) => room.name)).toEqual([
      '#a:example.org',
      '!b:example.org',
    ]);
  });
});

describe('resolveReplacedRooms', () => {
  const makeResolver = (replacements: Record<string, string>, joined: string[]) =>
    [
      (roomId: string) =>
        replacements[roomId] ? { roomId: replacements[roomId], via: ['example.org'] } : undefined,
      (roomId: string) => joined.includes(roomId),
    ] as const;

  it('keeps rooms that were never replaced', () => {
    expect(resolveReplacedRooms(['!a', '!b'], ...makeResolver({}, ['!a', '!b']))).toEqual([
      { kind: 'joined', roomId: '!a', predecessorIds: [] },
      { kind: 'joined', roomId: '!b', predecessorIds: [] },
    ]);
  });

  it('swaps a replaced room for its joined replacement in place', () => {
    expect(
      resolveReplacedRooms(
        ['!x', '!old', '!y'],
        ...makeResolver({ '!old': '!new' }, ['!x', '!old', '!y', '!new'])
      )
    ).toEqual([
      { kind: 'joined', roomId: '!x', predecessorIds: [] },
      { kind: 'joined', roomId: '!new', predecessorIds: ['!old'] },
      { kind: 'joined', roomId: '!y', predecessorIds: [] },
    ]);
  });

  it('drops the old room when its replacement is also listed', () => {
    expect(
      resolveReplacedRooms(['!new', '!old'], ...makeResolver({ '!old': '!new' }, ['!old', '!new']))
    ).toEqual([{ kind: 'joined', roomId: '!new', predecessorIds: ['!old'] }]);
    expect(
      resolveReplacedRooms(['!old', '!new'], ...makeResolver({ '!old': '!new' }, ['!old', '!new']))
    ).toEqual([{ kind: 'joined', roomId: '!new', predecessorIds: ['!old'] }]);
  });

  it('follows a chain of upgrades to the newest room', () => {
    expect(
      resolveReplacedRooms(
        ['!v1'],
        ...makeResolver({ '!v1': '!v2', '!v2': '!v3' }, ['!v1', '!v2', '!v3'])
      )
    ).toEqual([{ kind: 'joined', roomId: '!v3', predecessorIds: ['!v1', '!v2'] }]);
  });

  it('offers an unjoined replacement instead of the old room', () => {
    expect(
      resolveReplacedRooms(['!v1'], ...makeResolver({ '!v1': '!v2', '!v2': '!v3' }, ['!v1', '!v2']))
    ).toEqual([
      {
        kind: 'unjoined',
        roomId: '!v3',
        via: ['example.org'],
        latestJoinedId: '!v2',
        predecessorIds: ['!v1', '!v2'],
      },
    ]);
  });

  it('stops on replacement cycles', () => {
    expect(
      resolveReplacedRooms(['!a'], ...makeResolver({ '!a': '!b', '!b': '!a' }, ['!a', '!b']))
    ).toEqual([{ kind: 'joined', roomId: '!b', predecessorIds: ['!a'] }]);
  });
});
