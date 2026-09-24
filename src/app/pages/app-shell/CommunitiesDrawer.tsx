import React from 'react';
import { useNavigate } from 'react-router-dom';
import FocusTrap from 'focus-trap-react';
import { Room } from 'matrix-js-sdk';
import { stopPropagation } from '../../utils/keyboard';
import { getAppCommunityPath } from '../pathUtils';
import { CommunityList, CreateCommunityButton } from './CommunityList';
import * as css from './CommunitiesDrawer.css';

type CommunitiesDrawerProps = {
  open: boolean;
  communities: Room[];
  currentCommunityId?: string;
  /** Path to navigate to when a community is picked; defaults to its feed. */
  getCommunityPath?: (communityId: string) => string;
  onCreateCommunity: () => void;
  onClose: () => void;
};

export function CommunitiesDrawer({
  open,
  communities,
  currentCommunityId,
  getCommunityPath = getAppCommunityPath,
  onCreateCommunity,
  onClose,
}: CommunitiesDrawerProps) {
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
            <CommunityList
              communities={communities}
              currentCommunityId={currentCommunityId}
              onSelect={handleSelect}
            />
          </div>
          <div className={css.Footer}>
            <CreateCommunityButton onClick={onCreateCommunity} />
          </div>
        </div>
      </FocusTrap>
    </>
  );
}
