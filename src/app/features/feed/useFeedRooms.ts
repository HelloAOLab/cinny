import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import {
  RoomSelector,
  useRecursiveChildRoomScopeFactory,
  useSelectedRooms,
  useSpaceChildren,
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
