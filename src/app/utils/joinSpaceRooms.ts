import { MatrixClient } from 'matrix-js-sdk';
import { IHierarchyRoom } from 'matrix-js-sdk/lib/@types/spaces';
import { rateLimitedActions } from './matrix';

export type SpaceRoomToJoin = {
  roomId: string;
  via: string[];
};

// Rooms with these join rules can't be joined without an invite, so there's
// no point attempting them.
const UNJOINABLE_JOIN_RULES = new Set<string>(['invite', 'knock', 'private']);

/**
 * From a space hierarchy response, picks every room (including sub-spaces)
 * below the space that the user hasn't joined yet and could join, along with
 * the via servers advertised by the parent's m.space.child event. The
 * hierarchy's order is kept, so a sub-space comes before its own children
 * (restricted rooms may require membership of their parent sub-space).
 */
export const getSpaceRoomsToJoin = (
  spaceId: string,
  hierarchyRooms: IHierarchyRoom[],
  isJoined: (roomId: string) => boolean
): SpaceRoomToJoin[] => {
  const viaMap = new Map<string, string[]>();
  hierarchyRooms.forEach((room) => {
    room.children_state?.forEach((childState) => {
      const via: unknown = childState.content?.via;
      if (Array.isArray(via) && !viaMap.has(childState.state_key)) {
        viaMap.set(
          childState.state_key,
          via.filter((server): server is string => typeof server === 'string')
        );
      }
    });
  });

  const seen = new Set<string>();
  return hierarchyRooms
    .filter((room) => {
      if (room.room_id === spaceId || seen.has(room.room_id)) return false;
      seen.add(room.room_id);
      if (isJoined(room.room_id)) return false;
      const joinRule: string | undefined = room.join_rule;
      return !joinRule || !UNJOINABLE_JOIN_RULES.has(joinRule);
    })
    .map((room) => ({
      roomId: room.room_id,
      via: viaMap.get(room.room_id) ?? [],
    }));
};

const HIERARCHY_PAGE_LIMIT = 100;
const HIERARCHY_MAX_PAGES = 10;

const fetchSpaceHierarchy = async (
  mx: MatrixClient,
  spaceId: string
): Promise<IHierarchyRoom[]> => {
  const rooms: IHierarchyRoom[] = [];
  let from: string | undefined;
  for (let page = 0; page < HIERARCHY_MAX_PAGES; page += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await mx.getRoomHierarchy(spaceId, HIERARCHY_PAGE_LIMIT, undefined, false, from);
    rooms.push(...res.rooms);
    from = res.next_batch;
    if (!from) break;
  }
  return rooms;
};

/**
 * Joins every room in a space the user has just joined. Rooms that fail to
 * join (e.g. no longer joinable) are skipped; the space join itself has
 * already succeeded, so this never throws.
 */
export const joinSpaceRooms = async (mx: MatrixClient, spaceId: string): Promise<void> => {
  try {
    const hierarchy = await fetchSpaceHierarchy(mx, spaceId);
    const isJoined = (roomId: string) => mx.getRoom(roomId)?.getMyMembership() === 'join';
    const toJoin = getSpaceRoomsToJoin(spaceId, hierarchy, isJoined);

    // Failed joins are skipped by rateLimitedActions; rate limits are retried.
    await rateLimitedActions(
      toJoin,
      (room) => mx.joinRoom(room.roomId, { viaServers: room.via }),
      3
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to join rooms of space ${spaceId}`, err);
  }
};
