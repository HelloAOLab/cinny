import { Room } from 'matrix-js-sdk';

export const POSTS_ROOM_NAME_SUFFIX = '-posts';

export const isPostsRoomName = (name: string | undefined): boolean =>
  !!name && name.toLowerCase().endsWith(POSTS_ROOM_NAME_SUFFIX);

/**
 * Given a space's child room IDs in m.space.child state-event order, returns
 * the first child room whose name ends with "-posts". `getRoom` is injected
 * so this stays testable without a live MatrixClient.
 */
export const findPostsRoom = (
  childRoomIds: string[],
  getRoom: (roomId: string) => Room | undefined | null
): Room | undefined =>
  childRoomIds
    .map((roomId) => getRoom(roomId))
    .find((room): room is Room => !!room && isPostsRoomName(room.name));
