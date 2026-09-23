import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useSpaces } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { getAppCommunityPath } from '../pathUtils';
import { AppEmptyState } from './AppEmptyState';
import { useAppOutletContext } from './AppOutletContext';

export function AppIndexRedirect() {
  const mx = useMatrixClient();
  const joinedCommunityIds = useSpaces(mx, allRoomsAtom);
  const { onCreateCommunity } = useAppOutletContext();

  const [firstCommunityId] = joinedCommunityIds;
  if (firstCommunityId) {
    return <Navigate to={getAppCommunityPath(firstCommunityId)} replace />;
  }

  return (
    <AppEmptyState
      title="No communities yet"
      subtitle="Join or create a community to see its posts here."
      action={onCreateCommunity && { label: 'Create community', onClick: onCreateCommunity }}
    />
  );
}
