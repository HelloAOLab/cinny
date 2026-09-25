import React, { ReactNode } from 'react';
import { Room } from 'matrix-js-sdk';
import { ChatIcon, HomeIcon, PrayerIcon, SearchIcon, VideoIcon } from './AppIcons';
import { CommunitySections, CreateCommunityButton } from './CommunityList';
import * as css from './AppSidebar.css';

type SidebarNavItemProps = {
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function SidebarNavItem({ label, icon, active, disabled, onClick }: SidebarNavItemProps) {
  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      className={`${css.NavItem} ${onClick ? css.NavItemLink : ''} ${
        active ? css.NavItemActive : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={css.NavItemIcon}>{icon}</span>
      {label}
    </button>
  );
}

type AppSidebarProps = {
  communities: Room[];
  /** Communities the user has been invited to but not yet joined. */
  communityInvites: Room[];
  currentCommunityId?: string;
  /** Section highlighted in the nav; none on pages like community settings. */
  activeSection?: 'home' | 'chat';
  onOpenHome: () => void;
  onOpenChat: () => void;
  onSelectCommunity: (communityId: string) => void;
  onCreateCommunity: () => void;
};

/**
 * Persistent left column of the /app shell's desktop layout: the sections that live in the mobile bottom nav, and the community list that
 * the mobile drawer holds.
 */
export function AppSidebar({
  communities,
  communityInvites,
  currentCommunityId,
  activeSection,
  onOpenHome,
  onOpenChat,
  onSelectCommunity,
  onCreateCommunity,
}: AppSidebarProps) {
  return (
    <aside className={css.Sidebar}>
      <div className={css.Top}>
        <nav className={css.Nav} aria-label="Sections">
          <SidebarNavItem
            label="Home"
            icon={<HomeIcon />}
            active={activeSection === 'home'}
            onClick={onOpenHome}
          />
          <SidebarNavItem
            label="Chat"
            icon={<ChatIcon />}
            active={activeSection === 'chat'}
            disabled={!currentCommunityId}
            onClick={onOpenChat}
          />
          <SidebarNavItem label="Search" icon={<SearchIcon />} />
          <SidebarNavItem label="Prayer" icon={<PrayerIcon size={24} />} />
          <SidebarNavItem label="Video stories" icon={<VideoIcon />} />
        </nav>
      </div>
      <span className={css.SectionTitle}>Communities</span>
      <div className={css.Communities}>
        <CommunitySections
          invites={communityInvites}
          onJoined={onSelectCommunity}
          communities={communities}
          currentCommunityId={currentCommunityId}
          onSelect={onSelectCommunity}
        />
      </div>
      <div className={css.Footer}>
        <CreateCommunityButton onClick={onCreateCommunity} />
      </div>
    </aside>
  );
}
