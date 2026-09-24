import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useRoomNavigate } from '../../hooks/useRoomNavigate';
import { useSpaces } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { allInvitesAtom } from '../../state/room-list/inviteList';
import { roomToParentsAtom } from '../../state/room/roomToParents';
import { getCanonicalAliasOrRoomId } from '../../utils/matrix';
import { useCommunityOptionally } from '../../pages/app-shell/CommunityContext';
import { getAppCommunityChatRoomPath, getAppCommunityPath } from '../../pages/pathUtils';
import { Invites, Notifications } from '../../pages/client/inbox';
import { isPostsRoomName } from '../app-feed/findPostsRoom';
import { getAppRoomTarget } from './appRoomTarget';
import * as css from './AppInbox.css';

type InboxTab = 'notifications' | 'invites';

/**
 * The inbox (notifications and invites) inside the /app shell. Reuses the main
 * client's inbox pages, but opens rooms in the shell's own views where it has
 * one, so users aren't dropped into the main client's layout.
 */
export function AppInboxScreen() {
  const mx = useMatrixClient();
  const navigate = useNavigate();
  const { navigateRoom } = useRoomNavigate();
  const community = useCommunityOptionally();
  const communityIds = useSpaces(mx, allRoomsAtom);
  const roomToParents = useAtomValue(roomToParentsAtom);
  const inviteCount = useAtomValue(allInvitesAtom).length;
  const [tab, setTab] = useState<InboxTab>('notifications');

  const openRoom = useCallback(
    (roomId: string, eventId?: string) => {
      const target = getAppRoomTarget(
        roomId,
        communityIds,
        roomToParents,
        (id) => isPostsRoomName(mx.getRoom(id)?.name),
        community?.roomId
      );
      if (!target) {
        // The shell has no view for rooms outside a community (e.g. DMs).
        navigateRoom(roomId, eventId);
        return;
      }
      const communityIdOrAlias = getCanonicalAliasOrRoomId(mx, target.communityId);
      if (target.kind === 'feed') {
        navigate(getAppCommunityPath(communityIdOrAlias));
        return;
      }
      navigate(
        getAppCommunityChatRoomPath(
          communityIdOrAlias,
          getCanonicalAliasOrRoomId(mx, target.roomId)
        )
      );
    },
    [mx, navigate, navigateRoom, communityIds, roomToParents, community]
  );

  const handleInviteAccepted = useCallback(
    (roomId: string, space: boolean) => {
      // A freshly joined community may not be in the space list yet.
      if (space) {
        navigate(getAppCommunityPath(getCanonicalAliasOrRoomId(mx, roomId)));
        return;
      }
      openRoom(roomId);
    },
    [mx, navigate, openRoom]
  );

  const tabs: { value: InboxTab; label: string; count?: number }[] = [
    { value: 'notifications', label: 'Notifications' },
    { value: 'invites', label: 'Invites', count: inviteCount },
  ];

  return (
    <div className={css.Screen}>
      <nav className={css.Tabs}>
        {tabs.map(({ value, label, count }) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              className={`${css.Tab} ${active ? css.TabActive : ''}`}
              onClick={() => setTab(value)}
            >
              {label}
              {!!count && <span className={css.TabBadge}>{count}</span>}
            </button>
          );
        })}
      </nav>
      <div className={css.Body}>
        {tab === 'notifications' ? (
          <Notifications hideHeader onOpenRoom={openRoom} />
        ) : (
          <Invites hideHeader onNavigate={handleInviteAccepted} />
        )}
      </div>
    </div>
  );
}
