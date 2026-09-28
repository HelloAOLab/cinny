import { describe, expect, it } from 'vitest';
import { IHierarchyRoom } from 'matrix-js-sdk/lib/@types/spaces';
import { getSpaceRoomsToJoin } from './joinSpaceRooms';

const hierarchyRoom = (
  roomId: string,
  extra: Omit<Partial<IHierarchyRoom>, 'join_rule'> & { join_rule?: string } = {}
): IHierarchyRoom =>
  ({
    room_id: roomId,
    world_readable: false,
    guest_can_join: false,
    num_joined_members: 1,
    children_state: [],
    ...extra,
  } as IHierarchyRoom);

const child = (stateKey: string, via?: unknown) => ({
  type: 'm.space.child',
  state_key: stateKey,
  sender: '@alice:example.org',
  origin_server_ts: 0,
  content: via === undefined ? {} : { via },
});

describe('getSpaceRoomsToJoin', () => {
  const spaceId = '!space:example.org';

  it('returns unjoined rooms and sub-spaces with their via servers, in hierarchy order', () => {
    const rooms = [
      hierarchyRoom(spaceId, {
        room_type: 'm.space',
        children_state: [
          child('!sub:example.org', ['example.org']),
          child('!a:example.org', ['a.org', 5]),
        ],
      } as Partial<IHierarchyRoom>),
      hierarchyRoom('!sub:example.org', {
        room_type: 'm.space',
        children_state: [child('!b:example.org', ['b.org'])],
      } as Partial<IHierarchyRoom>),
      hierarchyRoom('!b:example.org'),
      hierarchyRoom('!a:example.org'),
    ];

    expect(getSpaceRoomsToJoin(spaceId, rooms, () => false)).toEqual([
      { roomId: '!sub:example.org', via: ['example.org'] },
      { roomId: '!b:example.org', via: ['b.org'] },
      { roomId: '!a:example.org', via: ['a.org'] },
    ]);
  });

  it('skips the space itself, joined rooms, duplicates and invite-only rooms', () => {
    const rooms = [
      hierarchyRoom(spaceId, { room_type: 'm.space' } as Partial<IHierarchyRoom>),
      hierarchyRoom('!joined:example.org'),
      hierarchyRoom('!invite:example.org', { join_rule: 'invite' }),
      hierarchyRoom('!knock:example.org', { join_rule: 'knock' }),
      hierarchyRoom('!public:example.org', { join_rule: 'public' }),
      hierarchyRoom('!restricted:example.org', { join_rule: 'restricted' }),
      hierarchyRoom('!public:example.org', { join_rule: 'public' }),
    ];

    expect(
      getSpaceRoomsToJoin(spaceId, rooms, (roomId) => roomId === '!joined:example.org')
    ).toEqual([
      { roomId: '!public:example.org', via: [] },
      { roomId: '!restricted:example.org', via: [] },
    ]);
  });
});
