import React, { useState } from 'react';
import { Outlet, useMatch, useNavigate, useParams } from 'react-router-dom';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useClientConfig } from '../../hooks/useClientConfig';
import { useScreenSizeContext } from '../../hooks/useScreenSize';
import { useSpaces } from '../../state/hooks/roomList';
import { allRoomsAtom } from '../../state/room-list/roomList';
import { useSpaceInvites } from '../../state/hooks/inviteList';
import { allInvitesAtom } from '../../state/room-list/inviteList';
import { mxcUrlToHttp } from '../../utils/matrix';
import { nameInitials } from '../../utils/common';
import { PostSharingLevel } from '../../features/create-post/postSharing';
import { POST_TYPE_OPTIONS, PostType } from '../../features/create-post/postType';
import { CommunitiesDrawer } from './CommunitiesDrawer';
import { AccountMenu } from './AccountMenu';
import { SharePostFlow } from './SharePostFlow';
import { SharePostComposer } from './SharePostComposer';
import { CreateCommunityFlow } from './CreateCommunityFlow';
import { CommunitySettingsButton } from './CommunitySettingsButton';
import { InviteFlow } from './InviteFlow';
import { AppOutletContext } from './AppOutletContext';
import { AppSidebar } from './AppSidebar';
import { AppDialogFrame } from './AppDialogFrame';
import { Settings, SettingsPages } from '../../features/settings';
import { Modal500 } from '../../components/Modal500';
import {
  ChatIcon,
  HomeIcon,
  MailIcon,
  MenuIcon,
  PlusIcon,
  PrayerIcon,
  SearchIcon,
  VideoIcon,
} from './AppIcons';
import { isAppChatSplitLayout, isAppDesktopLayout } from './appLayout';
import {
  getAppCommunityChatPath,
  getAppCommunityPath,
  getAppInboxPath,
  getAppPath,
} from '../pathUtils';
import {
  APP_COMMUNITY_CHAT_PATH,
  APP_COMMUNITY_CHAT_ROOM_PATH,
  APP_COMMUNITY_INBOX_PATH,
  APP_COMMUNITY_SETTINGS_PATH,
  APP_INBOX_PATH,
} from '../paths';
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
  const { registrationBot } = useClientConfig();
  const { communityIdOrAlias } = useParams();
  const chatListMatch = useMatch({ path: APP_COMMUNITY_CHAT_PATH, caseSensitive: true, end: true });
  const chatRoomMatch = useMatch({
    path: APP_COMMUNITY_CHAT_ROOM_PATH,
    caseSensitive: true,
    end: true,
  });
  const settingsMatch = useMatch({
    path: APP_COMMUNITY_SETTINGS_PATH,
    caseSensitive: true,
    end: true,
  });
  const inboxMatch = useMatch({ path: APP_INBOX_PATH, caseSensitive: true, end: true });
  const communityInboxMatch = useMatch({
    path: APP_COMMUNITY_INBOX_PATH,
    caseSensitive: true,
    end: true,
  });
  const chatMode = !!chatListMatch || !!chatRoomMatch;
  const inboxMode = !!inboxMatch || !!communityInboxMatch;
  const homeMode = !chatMode && !inboxMode;
  const screenSize = useScreenSizeContext();
  const desktop = isAppDesktopLayout(screenSize);
  // Rooms, the chat list/room split and the inbox manage their own scrolling.
  const fillsMain = !!chatRoomMatch || inboxMode || (chatMode && isAppChatSplitLayout(screenSize));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [shareFlowOpen, setShareFlowOpen] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  // `page` is undefined for the default landing page.
  const [settingsOpen, setSettingsOpen] = useState<{ page?: SettingsPages }>();
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

  const communityInviteIds = useSpaceInvites(mx, allInvitesAtom);
  const communityInvites = communityInviteIds
    .map((roomId) => mx.getRoom(roomId))
    .filter((room): room is NonNullable<typeof room> => !!room);

  const community = communityIdOrAlias ? mx.getRoom(communityIdOrAlias) : undefined;
  const joinedCommunity =
    community && joinedCommunityIds.includes(community.roomId) ? community : undefined;

  const handleShareComplete = (
    postType: PostType,
    sharing: PostSharingLevel,
    sharingMedia: PostSharingLevel
  ) => {
    setShareFlowOpen(false);
    setComposerState({ postType, sharing, sharingMedia });
  };

  const handleCommunityCreated = (communityId: string) => {
    setCreateCommunityOpen(false);
    navigate(getAppCommunityPath(communityId));
  };

  // Without a community, Home falls back to the index page, which shows the
  // "No communities yet" empty state.
  const openHome = () =>
    navigate(communityIdOrAlias ? getAppCommunityPath(communityIdOrAlias) : getAppPath());

  const outletContext: AppOutletContext = {
    postTypeFilter,
    onCreateCommunity: () => setCreateCommunityOpen(true),
  };

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
        aria-current={homeMode ? 'page' : undefined}
        className={`${css.NavButton} ${css.NavButtonLink} ${homeMode ? css.NavButtonActive : ''}`}
        onClick={openHome}
      >
        <HomeIcon />
        {homeMode && <span className={css.NavButtonLabel}>Home</span>}
      </button>
      <button type="button" aria-label="Search" className={css.NavButton}>
        <SearchIcon />
      </button>
      <button type="button" aria-label="Prayer" className={css.NavButton}>
        <PrayerIcon />
      </button>
      <button type="button" aria-label="Video stories" className={css.NavButton}>
        <VideoIcon />
      </button>
      <button
        type="button"
        aria-label="Chat"
        aria-current={chatMode ? 'page' : undefined}
        className={`${css.NavButton} ${css.NavButtonLink} ${chatMode ? css.NavButtonActive : ''}`}
        disabled={!communityIdOrAlias}
        onClick={() => communityIdOrAlias && navigate(getAppCommunityChatPath(communityIdOrAlias))}
      >
        <ChatIcon />
        {chatMode && <span className={css.NavButtonLabel}>Chat</span>}
      </button>
    </nav>
  );

  const accountButton = (
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
        onInvite={registrationBot ? () => setInviteOpen(true) : undefined}
        onOpenSettings={() => setSettingsOpen({})}
        onOpenSecurity={() => setSettingsOpen({ page: SettingsPages.DevicesPage })}
        onClose={() => setAccountMenuOpen(false)}
      />
    </div>
  );

  const headerActions = (
    <>
      <div className={css.HeaderSpacer} />
      {joinedCommunity && <CommunitySettingsButton community={joinedCommunity} />}
      <button
        type="button"
        aria-label="Inbox"
        aria-current={inboxMode ? 'page' : undefined}
        className={`${css.IconButton} ${inboxMode ? css.IconButtonActive : ''}`}
        onClick={() => navigate(getAppInboxPath(communityIdOrAlias))}
      >
        <MailIcon />
      </button>
      {accountButton}
    </>
  );

  const tabs = (
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
  );

  const flows = (
    <>
      {createCommunityOpen && (
        <AppDialogFrame desktop={desktop}>
          <CreateCommunityFlow
            open
            onClose={() => setCreateCommunityOpen(false)}
            onCreate={handleCommunityCreated}
          />
        </AppDialogFrame>
      )}

      {registrationBot && inviteOpen && (
        <AppDialogFrame desktop={desktop}>
          <InviteFlow open botConfig={registrationBot} onClose={() => setInviteOpen(false)} />
        </AppDialogFrame>
      )}

      {settingsOpen && (
        <Modal500 requestClose={() => setSettingsOpen(undefined)}>
          <Settings
            initialPage={settingsOpen.page}
            requestClose={() => setSettingsOpen(undefined)}
          />
        </Modal500>
      )}

      {shareFlowOpen && (
        <AppDialogFrame desktop={desktop}>
          <SharePostFlow
            open
            onClose={() => setShareFlowOpen(false)}
            onComplete={handleShareComplete}
          />
        </AppDialogFrame>
      )}

      {composerState && (
        <AppDialogFrame desktop={desktop}>
          <SharePostComposer
            open
            defaultSpaceId={community?.roomId}
            sharing={composerState.sharing}
            sharingMedia={composerState.sharingMedia}
            postType={composerState.postType}
            onClose={() => setComposerState(undefined)}
          />
        </AppDialogFrame>
      )}
    </>
  );

  let activeSection: 'home' | 'chat' | undefined = 'home';
  if (chatMode) activeSection = 'chat';
  else if (settingsMatch || inboxMode) activeSection = undefined;

  // Switching community keeps the user in the section they're in.
  const getSectionPath = (communityId: string): string => {
    if (inboxMode) return getAppInboxPath(communityId);
    if (chatMode) return getAppCommunityChatPath(communityId);
    return getAppCommunityPath(communityId);
  };

  let headerTitle = 'Posts';
  if (chatMode) headerTitle = 'Chat';
  else if (inboxMode) headerTitle = 'Inbox';

  if (desktop) {
    return (
      <div className={`${css.Shell} ${css.DesktopShell}`}>
        <AppSidebar
          communities={joinedCommunities}
          communityInvites={communityInvites}
          currentCommunityId={communityIdOrAlias}
          activeSection={activeSection}
          onOpenHome={openHome}
          onOpenChat={() =>
            communityIdOrAlias && navigate(getAppCommunityChatPath(communityIdOrAlias))
          }
          onSelectCommunity={(communityId) => navigate(getSectionPath(communityId))}
          onCreateCommunity={() => setCreateCommunityOpen(true)}
        />

        <div className={css.DesktopMain}>
          {settingsMatch ? (
            // The settings page brings its own header with a back link.
            <div className={css.DesktopPageArea}>
              <Outlet context={outletContext} />
            </div>
          ) : (
            <>
              <header className={`${css.Header} ${css.DesktopHeader}`}>
                <span className={css.HeaderTitle}>{headerTitle}</span>
                {community && <span className={css.DesktopHeaderCommunity}>{community.name}</span>}
                {headerActions}
              </header>

              {fillsMain && (
                <div className={css.DesktopChatArea}>
                  <Outlet context={outletContext} />
                </div>
              )}
              {!fillsMain && homeMode && (
                <div className={css.DesktopTabsBar}>
                  <div className={css.DesktopColumn}>{tabs}</div>
                </div>
              )}
              {!fillsMain && (
                <div className={`${css.ScrollArea} ${css.DesktopScrollArea}`}>
                  <div className={css.DesktopColumn}>
                    <Outlet context={outletContext} />
                  </div>
                </div>
              )}
            </>
          )}

          {!settingsMatch && !chatMode && (
            <button
              type="button"
              className={`${css.ShareFab} ${css.DesktopShareFab}`}
              disabled={joinedCommunities.length === 0}
              onClick={() => setShareFlowOpen(true)}
            >
              <PlusIcon />
              Share
            </button>
          )}
        </div>

        {flows}
      </div>
    );
  }

  if (chatRoomMatch || settingsMatch) {
    // A room's own header, timeline and composer take the full screen, as
    // does the community settings page.
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
          <MenuIcon />
        </button>
        <span className={css.HeaderTitle}>{headerTitle}</span>
        {headerActions}
      </header>

      {homeMode && tabs}

      {inboxMode ? (
        <div className={css.FillArea}>
          <Outlet context={outletContext} />
        </div>
      ) : (
        <div className={css.ScrollArea}>
          <Outlet context={outletContext} />
        </div>
      )}

      {homeMode && (
        <button
          type="button"
          className={css.ShareFab}
          disabled={joinedCommunities.length === 0}
          onClick={() => setShareFlowOpen(true)}
        >
          <PlusIcon />
          Share
        </button>
      )}

      {bottomNav}

      <CommunitiesDrawer
        open={drawerOpen}
        communities={joinedCommunities}
        communityInvites={communityInvites}
        currentCommunityId={communityIdOrAlias}
        getCommunityPath={getSectionPath}
        onCreateCommunity={() => {
          setDrawerOpen(false);
          setCreateCommunityOpen(true);
        }}
        onClose={() => setDrawerOpen(false)}
      />

      {flows}
    </div>
  );
}
