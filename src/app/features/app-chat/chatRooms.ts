import { MsgType } from 'matrix-js-sdk';
import { IHierarchyRoom } from 'matrix-js-sdk/lib/@types/spaces';
import { MessageEvent } from '../../../types/matrix/room';
import { trimReplyFromBody } from '../../utils/room';

type PreviewableEvent = {
  type: string;
  content: Record<string, unknown>;
};

/**
 * One-line preview of a room's latest event for the chat list. Returns
 * undefined for events that shouldn't be previewed (state changes, redacted
 * messages, etc.).
 */
export const getMessagePreview = ({ type, content }: PreviewableEvent): string | undefined => {
  if (type === MessageEvent.RoomMessageEncrypted) return 'Encrypted message';
  if (type === MessageEvent.Sticker) return 'Sticker';
  if (type !== MessageEvent.RoomMessage) return undefined;

  switch (content.msgtype) {
    case MsgType.Image:
      return 'Photo';
    case MsgType.Video:
      return 'Video';
    case MsgType.Audio:
      return 'Audio';
    case MsgType.File:
      return 'File';
    case MsgType.Location:
      return 'Location';
    default:
      break;
  }

  if (typeof content.body !== 'string') return undefined;
  const body = trimReplyFromBody(content.body).replace(/\s+/g, ' ').trim();
  return body || undefined;
};

export type UnjoinedChatRoom = {
  roomId: string;
  name: string;
  topic?: string;
  avatarUrl?: string;
  memberCount: number;
  via: string[];
};

/**
 * From a space hierarchy response, picks the (non-space) rooms the user
 * hasn't joined yet, along with the via servers advertised by the parent's
 * m.space.child event so they can be joined.
 */
export const getUnjoinedChatRooms = (
  spaceId: string,
  hierarchyRooms: IHierarchyRoom[],
  isJoined: (roomId: string) => boolean
): UnjoinedChatRoom[] => {
  const viaMap = new Map<string, string[]>();
  hierarchyRooms.forEach((room) => {
    room.children_state?.forEach((childState) => {
      const via: unknown = childState.content?.via;
      if (Array.isArray(via)) {
        viaMap.set(
          childState.state_key,
          via.filter((server): server is string => typeof server === 'string')
        );
      }
    });
  });

  return hierarchyRooms
    .filter(
      (room) => room.room_id !== spaceId && room.room_type !== 'm.space' && !isJoined(room.room_id)
    )
    .map((room) => ({
      roomId: room.room_id,
      name: room.name || room.canonical_alias || room.room_id,
      topic: room.topic,
      avatarUrl: room.avatar_url,
      memberCount: room.num_joined_members,
      via: viaMap.get(room.room_id) ?? [],
    }));
};

export type RoomReplacement = {
  /** The room that replaced this one (m.room.tombstone `replacement_room`). */
  roomId: string;
  /** Servers to try when joining the replacement room. */
  via: string[];
};

export type ResolvedChatRoom =
  | {
      /** A joined room at the end of its replacement chain. */
      kind: 'joined';
      roomId: string;
      /** Rooms in the list that were replaced by this one (oldest first). */
      predecessorIds: string[];
    }
  | {
      /** A replacement room the user hasn't joined yet. */
      kind: 'unjoined';
      roomId: string;
      via: string[];
      /** The newest room in the chain the user is still in; used for its name and avatar. */
      latestJoinedId: string;
      predecessorIds: string[];
    };

/**
 * Swaps every replaced (tombstoned) room in `roomIds` for the newest room in
 * its replacement chain, keeping the original order and dropping duplicates
 * (e.g. when both an old room and its replacement are in the list). If the
 * newest room hasn't been joined yet it is returned as `unjoined` so the
 * list can offer to join it instead of showing the dead room.
 */
export const resolveReplacedRooms = (
  roomIds: string[],
  getReplacement: (roomId: string) => RoomReplacement | undefined,
  isJoined: (roomId: string) => boolean
): ResolvedChatRoom[] => {
  const resolved = new Map<string, ResolvedChatRoom>();

  roomIds.forEach((startId) => {
    const chain = [startId];
    let via: string[] = [];
    let latestJoinedId = startId;
    let replacement = getReplacement(startId);
    while (replacement && !chain.includes(replacement.roomId)) {
      chain.push(replacement.roomId);
      via = replacement.via;
      if (isJoined(replacement.roomId)) latestJoinedId = replacement.roomId;
      replacement = getReplacement(replacement.roomId);
    }

    const roomId = chain[chain.length - 1];
    const predecessorIds = chain.slice(0, -1);
    const existing = resolved.get(roomId);
    if (existing) {
      predecessorIds.forEach((id) => {
        if (!existing.predecessorIds.includes(id)) existing.predecessorIds.push(id);
      });
      return;
    }
    resolved.set(
      roomId,
      isJoined(roomId)
        ? { kind: 'joined', roomId, predecessorIds }
        : { kind: 'unjoined', roomId, via, latestJoinedId, predecessorIds }
    );
  });

  return Array.from(resolved.values());
};
