import { describe, expect, it } from 'vitest';
import { RoomToParents } from '../../../types/matrix/room';
import { getAppRoomTarget } from './appRoomTarget';

const roomToParents: RoomToParents = new Map([
  ['!general:x', new Set(['!church:x'])],
  ['!church-posts:x', new Set(['!church:x'])],
  ['!youth:x', new Set(['!church:x'])],
  ['!youth-chat:x', new Set(['!youth:x'])],
  ['!shared:x', new Set(['!church:x', '!school:x'])],
]);
const communityIds = ['!church:x', '!school:x'];
const isPostsRoom = (roomId: string) => roomId.endsWith('-posts:x');

describe('getAppRoomTarget', () => {
  it('opens a community itself on its feed', () => {
    expect(getAppRoomTarget('!school:x', communityIds, roomToParents, isPostsRoom)).toEqual({
      kind: 'feed',
      communityId: '!school:x',
    });
  });

  it('opens a community room as a chat', () => {
    expect(getAppRoomTarget('!general:x', communityIds, roomToParents, isPostsRoom)).toEqual({
      kind: 'chat',
      communityId: '!church:x',
      roomId: '!general:x',
    });
  });

  it('finds the community through nested subspaces', () => {
    expect(getAppRoomTarget('!youth-chat:x', communityIds, roomToParents, isPostsRoom)).toEqual({
      kind: 'chat',
      communityId: '!church:x',
      roomId: '!youth-chat:x',
    });
  });

  it("opens a community's posts room on its feed", () => {
    expect(getAppRoomTarget('!church-posts:x', communityIds, roomToParents, isPostsRoom)).toEqual({
      kind: 'feed',
      communityId: '!church:x',
    });
  });

  it('prefers the open community when a room is in several', () => {
    expect(
      getAppRoomTarget('!shared:x', communityIds, roomToParents, isPostsRoom, '!school:x')
    ).toEqual({ kind: 'chat', communityId: '!school:x', roomId: '!shared:x' });
  });

  it('ignores a preferred community the room is not in', () => {
    expect(
      getAppRoomTarget('!general:x', communityIds, roomToParents, isPostsRoom, '!school:x')
    ).toEqual({ kind: 'chat', communityId: '!church:x', roomId: '!general:x' });
  });

  it('returns undefined for rooms outside every community', () => {
    expect(getAppRoomTarget('!dm:x', communityIds, roomToParents, isPostsRoom)).toBeUndefined();
  });
});
