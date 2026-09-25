import { RoomToParents } from '../../../types/matrix/room';
import { getAllParents } from '../../utils/room';

/** Where a room opens inside the /app shell. */
export type AppRoomTarget =
  /**
   * The community's home feed: the community itself, or its posts room. With
   * `eventId`, the feed focuses that post (or the post a comment belongs to).
   */
  | { kind: 'feed'; communityId: string; eventId?: string }
  /** A chat room within a community, optionally jumping to `eventId`. */
  | { kind: 'chat'; communityId: string; roomId: string; eventId?: string };

/**
 * Works out where the /app shell can show a room, so links from the inbox
 * and notifications stay inside the shell. Returns undefined for rooms
 * outside every joined community (e.g. DMs), which the shell has no view for.
 *
 * When the room sits in several communities, `preferredCommunityId` (the one
 * currently open) wins.
 */
export const getAppRoomTarget = (
  roomId: string,
  communityIds: string[],
  roomToParents: RoomToParents,
  isPostsRoom: (roomId: string) => boolean,
  preferredCommunityId?: string,
  eventId?: string
): AppRoomTarget | undefined => {
  // Events in the community room itself aren't posts, so the feed can't
  // focus them.
  if (communityIds.includes(roomId)) return { kind: 'feed', communityId: roomId };

  const parents = getAllParents(roomToParents, roomId);
  const candidates = communityIds.filter((id) => parents.has(id));
  const communityId =
    preferredCommunityId && candidates.includes(preferredCommunityId)
      ? preferredCommunityId
      : candidates[0];
  if (!communityId) return undefined;

  if (isPostsRoom(roomId)) {
    return eventId ? { kind: 'feed', communityId, eventId } : { kind: 'feed', communityId };
  }
  return eventId
    ? { kind: 'chat', communityId, roomId, eventId }
    : { kind: 'chat', communityId, roomId };
};

/**
 * The post an event in a posts room belongs to: comments are thread replies
 * to their post, anything else is taken to be the post itself.
 */
export const getPostIdForEvent = (
  eventId: string,
  content: Record<string, unknown> | undefined
): string => {
  const relation = content?.['m.relates_to'] as
    | { rel_type?: unknown; event_id?: unknown }
    | undefined;
  if (relation?.rel_type === 'm.thread' && typeof relation.event_id === 'string') {
    return relation.event_id;
  }
  return eventId;
};
