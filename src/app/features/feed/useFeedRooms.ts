import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import {
  RoomSelector,
  useRecursiveChildRoomScopeFactory,
  useSelectedRooms,
  useSpaceChildren,
  useSpaces,
} from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { mDirectAtom } from '../../state/mDirectList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { isRoom } from '../../utils/room';

export const useFeedRooms = (): string[] => {
  const mx = useMatrixClient();
  const selector: RoomSelector = useCallback((roomId) => isRoom(mx.getRoom(roomId)), [mx]);
  return useSelectedRooms(allRoomsAtom, selector);
};

export const useSpaceFeedRooms = (spaceId: string): string[] => {
  const mx = useMatrixClient();
  const mDirects = useAtomValue(mDirectAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);

  return useSpaceChildren(
    allRoomsAtom,
    spaceId,
    useRecursiveChildRoomScopeFactory(mx, mDirects, roomToParents)
  );
};

const POSTS_ROOM_SUFFIX = '-posts';

export type SpaceWithPostsRoom = {
  spaceId: string;
  postsRoomId: string;
};

/**
 * Spaces that contain at least one room whose name ends with "-posts",
 * paired with the id of the first such room (the post destination for that space).
 */
export const useSpacesWithPostsRoom = (): SpaceWithPostsRoom[] => {
  const mx = useMatrixClient();
  const allRooms = useAtomValue(allRoomsAtom);
  const mDirects = useAtomValue(mDirectAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const spaceIds = useSpaces(mx, allRoomsAtom);
  const childRoomSelectorFactory = useRecursiveChildRoomScopeFactory(mx, mDirects, roomToParents);

  return useMemo(
    () =>
      spaceIds.reduce<SpaceWithPostsRoom[]>((spacesWithPostsRoom, spaceId) => {
        const childRoomSelector = childRoomSelectorFactory(spaceId);
        const postsRoomId = allRooms.find(
          (roomId) =>
            childRoomSelector(roomId) && mx.getRoom(roomId)?.name.endsWith(POSTS_ROOM_SUFFIX)
        );
        if (postsRoomId) {
          spacesWithPostsRoom.push({ spaceId, postsRoomId });
        }
        return spacesWithPostsRoom;
      }, []),
    [mx, allRooms, spaceIds, childRoomSelectorFactory]
  );
};
