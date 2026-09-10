import { useCallback } from 'react';
import { RoomSelector, useSelectedRooms } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { isRoom } from '../../utils/room';

export const useFeedRooms = (): string[] => {
  const mx = useMatrixClient();
  const selector: RoomSelector = useCallback((roomId) => isRoom(mx.getRoom(roomId)), [mx]);
  return useSelectedRooms(allRoomsAtom, selector);
};
