import React from 'react';
import { useNavigate } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import { Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { getRoomAvatarUrl } from '../../utils/room';
import { nameInitials } from '../../utils/common';
import { stopPropagation } from '../../utils/keyboard';
import { getAppCommunityPath } from '../pathUtils';
import * as css from './CommunitiesDrawer.css';

type CommunitiesDrawerProps = {
  open: boolean;
  communities: Room[];
  currentCommunityId?: string;
  /** Path to navigate to when a community is picked; defaults to its feed. */
  getCommunityPath?: (communityId: string) => string;
  onClose: () => void;
};

export function CommunitiesDrawer({
  open,
  communities,
  currentCommunityId,
  getCommunityPath = getAppCommunityPath,
  onClose,
}: CommunitiesDrawerProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const navigate = useNavigate();

  if (!open) return null;

  const handleSelect = (roomId: string) => {
    navigate(getCommunityPath(roomId));
    onClose();
  };

  return (
    <>
      <button type="button" aria-label="Close menu" className={css.Backdrop} onClick={onClose} />
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          returnFocusOnDeactivate: false,
          onDeactivate: onClose,
          clickOutsideDeactivates: true,
          escapeDeactivates: stopPropagation,
        }}
      >
        <div className={css.Panel} role="dialog" aria-label="Communities">
          <div className={css.Header}>
            <span className={css.HeaderTitle}>Communities</span>
            <button
              type="button"
              aria-label="Close menu"
              className={css.CloseButton}
              onClick={onClose}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <div className={css.List}>
            {communities.length === 0 && (
              <span className={css.EmptyList}>You haven&apos;t joined any communities yet.</span>
            )}
            {communities.map((room) => {
              const avatarUrl = getRoomAvatarUrl(mx, room, 96, useAuthentication);
              return (
                <button
                  key={room.roomId}
                  type="button"
                  className={css.CommunityRow}
                  aria-current={room.roomId === currentCommunityId}
                  onClick={() => handleSelect(room.roomId)}
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
          </div>
        </div>
      </FocusTrap>
    </>
  );
}
