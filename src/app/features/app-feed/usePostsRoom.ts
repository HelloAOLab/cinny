import { useMemo } from 'react';
import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getSpaceChildren } from '../../utils/room';
import { findPostsRoom } from './findPostsRoom';

/**
 * Resolves a community's feed room: the first direct child room (in
 * m.space.child order) whose name ends with "-posts". Does not react to
 * m.space.child state changes after mount; acceptable for now since a
 * community's posts room rarely changes.
 */
export const usePostsRoom = (community: Room | null | undefined): Room | undefined => {
  const mx = useMatrixClient();

  return useMemo(() => {
    if (!community) return undefined;
    const childRoomIds = getSpaceChildren(community);
    return findPostsRoom(childRoomIds, (roomId) => mx.getRoom(roomId));
  }, [mx, community]);
};
