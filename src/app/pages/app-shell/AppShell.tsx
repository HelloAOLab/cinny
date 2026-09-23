import React, { useState } from 'react';
import { Outlet, useMatch, useNavigate, useParams } from 'react-router-dom';
import '@fontsource-variable/plus-jakarta-sans';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useSpaces } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { mxcUrlToHttp } from '../../utils/matrix';
import { nameInitials } from '../../utils/common';
import { PostSharingLevel } from '../../features/create-post/postSharing';
import { POST_TYPE_OPTIONS, PostType } from '../../features/create-post/postType';
import { CommunitiesDrawer } from './CommunitiesDrawer';
import { AccountMenu } from './AccountMenu';
import { SharePostFlow } from './SharePostFlow';
import { SharePostComposer } from './SharePostComposer';
import { AppOutletContext } from './AppOutletContext';
import { getAppCommunityChatPath, getAppCommunityPath } from '../pathUtils';
import { APP_COMMUNITY_CHAT_PATH, APP_COMMUNITY_CHAT_ROOM_PATH } from '../paths';
import * as css from './AppShell.css';

type Tab = { label: string; postType?: PostType };

const TABS: Tab[] = [
  { label: 'All' },
  ...POST_TYPE_OPTIONS.map((option) => ({ label: option.tabLabel, postType: option.value })),
];

export function AppShell() {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const navigate = useNavigate();
  const { communityIdOrAlias } = useParams();
  const chatListMatch = useMatch({ path: APP_COMMUNITY_CHAT_PATH, caseSensitive: true, end: true });
  const chatRoomMatch = useMatch({
    path: APP_COMMUNITY_CHAT_ROOM_PATH,
    caseSensitive: true,
    end: true,
  });
  const chatMode = !!chatListMatch || !!chatRoomMatch;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [shareFlowOpen, setShareFlowOpen] = useState(false);
  const [postTypeFilter, setPostTypeFilter] = useState<PostType>();
  const [composerState, setComposerState] = useState<{
    postType: PostType;
    sharing: PostSharingLevel;
    sharingMedia: PostSharingLevel;
  }>();

  const joinedCommunityIds = useSpaces(mx, allRoomsAtom);
  const joinedCommunities = joinedCommunityIds
    .map((roomId) => mx.getRoom(roomId))
    .filter((room): room is NonNullable<typeof room> => !!room);

  const community = communityIdOrAlias ? mx.getRoom(communityIdOrAlias) : undefined;

  const handleShareComplete = (
    postType: PostType,
    sharing: PostSharingLevel,
    sharingMedia: PostSharingLevel
  ) => {
    setShareFlowOpen(false);
    setComposerState({ postType, sharing, sharingMedia });
  };

  const outletContext: AppOutletContext = { postTypeFilter };

  const userId = mx.getSafeUserId();
  const profile = useUserProfile(userId);
  const userAvatarUrl = profile.avatarUrl
    ? mxcUrlToHttp(mx, profile.avatarUrl, useAuthentication, 72, 72, 'crop')
    : undefined;

  const bottomNav = (
    <nav className={css.BottomNav}>
      <button
        type="button"
        aria-label="Home"
        aria-current={!chatMode ? 'page' : undefined}
        className={`${css.NavButton} ${css.NavButtonLink} ${!chatMode ? css.NavButtonActive : ''}`}
        disabled={!communityIdOrAlias}
        onClick={() => communityIdOrAlias && navigate(getAppCommunityPath(communityIdOrAlias))}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 11 12 4l8 7" />
          <path d="M6 10v9h12v-9" />
        </svg>
        {!chatMode && <span className={css.NavButtonLabel}>Home</span>}
      </button>
      <button type="button" aria-label="Search" className={css.NavButton}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
      </button>
      <button type="button" aria-label="Prayer" className={css.NavButton}>
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 21c-1.5 0-2.6-.5-3.4-1.2L4.8 16.4c-.7-.6-.8-1.6-.2-2.2.6-.6 1.5-.7 2.2-.1l1.5 1.3V6.8c0-1 .8-1.7 1.7-1.6.7.1 1.1.8 1.1 1.5V12" />
          <path d="M12 21c1.5 0 2.6-.5 3.4-1.2l3.8-3.4c.7-.6.8-1.6.2-2.2-.6-.6-1.5-.7-2.2-.1l-1.5 1.3V6.8c0-1-.8-1.7-1.7-1.6-.7.1-1.1.8-1.1 1.5V12" />
        </svg>
      </button>
      <button type="button" aria-label="Video stories" className={css.NavButton}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="3" />
          <path d="M10 9l5 3-5 3z" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Chat"
        aria-current={chatMode ? 'page' : undefined}
        className={`${css.NavButton} ${css.NavButtonLink} ${chatMode ? css.NavButtonActive : ''}`}
        disabled={!communityIdOrAlias}
        onClick={() => communityIdOrAlias && navigate(getAppCommunityChatPath(communityIdOrAlias))}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1 1 21 11.5Z" />
        </svg>
        {chatMode && <span className={css.NavButtonLabel}>Chat</span>}
      </button>
    </nav>
  );

  if (chatRoomMatch) {
    // A room's own header, timeline and composer take the full screen.
    return (
      <div className={css.Shell}>
        <div className={css.RoomArea}>
          <Outlet context={outletContext} />
        </div>
      </div>
    );
  }

  return (
    <div className={css.Shell}>
      <header className={css.Header}>
        <button
          type="button"
          aria-label="Open menu"
          className={css.IconButton}
          onClick={() => setDrawerOpen(true)}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <span className={css.HeaderTitle}>{chatMode ? 'Chat' : 'Posts'}</span>
        <div className={css.HeaderSpacer} />
        <button type="button" aria-label="Notifications" className={css.IconButton}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
        </button>
        <button type="button" aria-label="Messages" className={css.IconButton}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="m3.5 7 8.5 6 8.5-6" />
          </svg>
        </button>
        <div className={css.AvatarWrapper}>
          <button
            type="button"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            className={css.UserAvatarButton}
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt="" width={36} height={36} />
            ) : (
              nameInitials(profile.displayName ?? userId, 2)
            )}
          </button>
          <AccountMenu
            open={accountMenuOpen}
            displayName={profile.displayName}
            userId={userId}
            onClose={() => setAccountMenuOpen(false)}
          />
        </div>
      </header>

      {!chatMode && (
        <nav className={css.Tabs}>
          {TABS.map((tab) => {
            const active = tab.postType === postTypeFilter;
            return (
              <button
                key={tab.label}
                type="button"
                aria-pressed={active}
                className={`${css.Tab} ${active ? css.TabActive : ''}`}
                onClick={() => setPostTypeFilter(tab.postType)}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      )}

      <div className={css.ScrollArea}>
        <Outlet context={outletContext} />
      </div>

      {!chatMode && (
        <button
          type="button"
          className={css.ShareFab}
          disabled={joinedCommunities.length === 0}
          onClick={() => setShareFlowOpen(true)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Share
        </button>
      )}

      {bottomNav}

      <CommunitiesDrawer
        open={drawerOpen}
        communities={joinedCommunities}
        currentCommunityId={communityIdOrAlias}
        getCommunityPath={chatMode ? getAppCommunityChatPath : getAppCommunityPath}
        onClose={() => setDrawerOpen(false)}
      />

      <SharePostFlow
        open={shareFlowOpen}
        onClose={() => setShareFlowOpen(false)}
        onComplete={handleShareComplete}
      />

      <SharePostComposer
        open={!!composerState}
        defaultSpaceId={community?.roomId}
        sharing={composerState?.sharing}
        sharingMedia={composerState?.sharingMedia}
        postType={composerState?.postType}
        onClose={() => setComposerState(undefined)}
      />
    </div>
  );
}
