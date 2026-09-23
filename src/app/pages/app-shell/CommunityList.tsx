import React from 'react';
import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { getRoomAvatarUrl } from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { PlusIcon } from './AppIcons';
import * as css from './CommunitiesDrawer.css';

type CommunityListProps = {
  communities: Room[];
  currentCommunityId?: string;
  onSelect: (communityId: string) => void;
};

/** Joined communities as selectable rows, shared by the mobile drawer and desktop sidebar. */
export function CommunityList({ communities, currentCommunityId, onSelect }: CommunityListProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();

  if (communities.length === 0) {
    return <span className={css.EmptyList}>You haven&apos;t joined any communities yet.</span>;
  }

  return (
    <>
      {communities.map((room) => {
        const avatarUrl = getRoomAvatarUrl(mx, room, 96, useAuthentication);
        return (
          <button
            key={room.roomId}
            type="button"
            className={css.CommunityRow}
            aria-current={room.roomId === currentCommunityId}
            onClick={() => onSelect(room.roomId)}
          >
            <span className={css.CommunityAvatar}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" width={40} height={40} />
              ) : (
                nameInitials(room.name, 2)
              )}
            </span>
            <span className={css.CommunityName}>{room.name}</span>
          </button>
        );
      })}
    </>
  );
}

export function CreateCommunityButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={css.CreateButton} onClick={onClick}>
      <span className={css.CreateIcon}>
        <PlusIcon />
      </span>
      <span className={css.CommunityName}>Create community</span>
    </button>
  );
}
