import React from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useSelectedRoom } from '../../hooks/router/useSelectedRoom';
import { IsDirectRoomProvider, RoomProvider } from '../../hooks/useRoom';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { mDirectAtom } from '../../state/mDirectList';
import { getAllParents } from '../../utils/room';
import { useCommunity } from '../../pages/app-shell/CommunityContext';
import { AppEmptyState } from '../../pages/app-shell/AppEmptyState';
import { getAppCommunityChatPath } from '../../pages/pathUtils';
import { Room } from '../room';
import * as css from './AppChat.css';

function BackToChats({ communityId }: { communityId: string }) {
  return (
    <Link to={getAppCommunityChatPath(communityId)} className={css.BackLink}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
      Chats
    </Link>
  );
}

/**
 * Full chat view for a room inside the /app shell. Reuses the main client's
 * Room feature (timeline, composer, reactions, threads...) so users can fully
 * participate, scoped to rooms the user has joined within the current
 * community.
 */
export function AppChatRoomScreen() {
  const mx = useMatrixClient();
  const community = useCommunity();
  const screenSize = useScreenSizeContext();
  const allRooms = useAtomValue(allRoomsAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const mDirects = useAtomValue(mDirectAtom);

  const roomId = useSelectedRoom();
  const room = roomId ? mx.getRoom(roomId) : undefined;

  if (
    !room ||
    !allRooms.includes(room.roomId) ||
    !getAllParents(roomToParents, room.roomId).has(community.roomId)
  ) {
    return (
      <div className={css.RoomScreen}>
        <div className={css.RoomScreenBackBar}>
          <BackToChats communityId={community.roomId} />
        </div>
        <AppEmptyState
          title="Room not available"
          subtitle={`Join this room from the ${community.name} chat list to start chatting.`}
        />
      </div>
    );
  }

  return (
    <div className={css.RoomScreen}>
      {/* The Room header only shows its own back button on mobile. */}
      {screenSize !== ScreenSize.Mobile && (
        <div className={css.RoomScreenBackBar}>
          <BackToChats communityId={community.roomId} />
        </div>
      )}
      <div className={css.RoomScreenBody}>
        <RoomProvider key={room.roomId} value={room}>
          <IsDirectRoomProvider value={mDirects.has(room.roomId)}>
            <Room />
          </IsDirectRoomProvider>
        </RoomProvider>
      </div>
    </div>
  );
}
