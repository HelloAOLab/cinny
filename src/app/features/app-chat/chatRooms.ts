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
