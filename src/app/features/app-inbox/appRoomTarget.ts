import { RoomToParents } from '../../../types/matrix/room';
import { getAllParents } from '../../utils/room';

/** Where a room opens inside the /app shell. */
export type AppRoomTarget =
  /** The community's home feed: the community itself, or its posts room. */
  | { kind: 'feed'; communityId: string }
  /** A chat room within a community. */
  | { kind: 'chat'; communityId: string; roomId: string };

/**
 * Works out where the /app shell can show a room, so links from the inbox
 * stay inside the shell. Returns undefined for rooms outside every joined
 * community (e.g. DMs), which the shell has no view for.
 *
 * When the room sits in several communities, `preferredCommunityId` (the one
 * currently open) wins.
 */
export const getAppRoomTarget = (
  roomId: string,
  communityIds: string[],
  roomToParents: RoomToParents,
  isPostsRoom: (roomId: string) => boolean,
  preferredCommunityId?: string
): AppRoomTarget | undefined => {
  if (communityIds.includes(roomId)) return { kind: 'feed', communityId: roomId };

  const parents = getAllParents(roomToParents, roomId);
  const candidates = communityIds.filter((id) => parents.has(id));
  const communityId =
    preferredCommunityId && candidates.includes(preferredCommunityId)
      ? preferredCommunityId
      : candidates[0];
  if (!communityId) return undefined;

  if (isPostsRoom(roomId)) return { kind: 'feed', communityId };
  return { kind: 'chat', communityId, roomId };
};
