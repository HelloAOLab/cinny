import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { allInvitesAtom } from '../../state/room-list/inviteList';
import { getCanonicalAliasOrRoomId } from '../../utils/matrix';
import { getAppCommunityPath } from '../../pages/pathUtils';
import { Invites, Notifications } from '../../pages/client/inbox';
import { useAppRoomNavigate } from './useAppRoomNavigate';
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
  const inviteCount = useAtomValue(allInvitesAtom).length;
  const [tab, setTab] = useState<InboxTab>('notifications');
  const openRoom = useAppRoomNavigate();

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
