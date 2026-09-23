import React, { ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useSpaces } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { getCanonicalAliasRoomId, isRoomAlias } from '../../utils/matrix';
import { getAppCommunityPath } from '../pathUtils';
import { CommunityProvider } from './CommunityContext';
import { AppEmptyState } from './AppEmptyState';

type RouteCommunityProviderProps = {
  children: ReactNode;
};

/**
 * Resolves the :communityIdOrAlias route param to a joined Space room.
 * Unlike the desktop RouteSpaceProvider, this does not offer a "join before
 * viewing" flow (that's part of the desktop UI's visual system) - /app is
 * for browsing communities the user has already joined.
 */
export function RouteCommunityProvider({ children }: RouteCommunityProviderProps) {
  const mx = useMatrixClient();
  const joinedCommunityIds = useSpaces(mx, allRoomsAtom);

  const { communityIdOrAlias } = useParams();
  const communityId =
    communityIdOrAlias && isRoomAlias(communityIdOrAlias)
      ? getCanonicalAliasRoomId(mx, communityIdOrAlias)
      : communityIdOrAlias;
  const community = communityId ? mx.getRoom(communityId) : undefined;

  if (!community || !joinedCommunityIds.includes(community.roomId)) {
    const fallbackCommunityId = joinedCommunityIds.find((id) => id !== communityId);
    if (fallbackCommunityId) {
      return <Navigate to={getAppCommunityPath(fallbackCommunityId)} replace />;
    }
    return <AppEmptyState title="Community not found" />;
  }

  return <CommunityProvider value={community}>{children}</CommunityProvider>;
}
