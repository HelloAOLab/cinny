import React, { useCallback, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { logoutClient } from '../../../client/initMatrix';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { stopPropagation } from '../../utils/keyboard';
import * as css from './AccountMenu.css';

const LOGOUT_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

type AccountMenuProps = {
  open: boolean;
  displayName?: string;
  userId: string;
  onClose: () => void;
};

export function AccountMenu({ open, displayName, userId, onClose }: AccountMenuProps) {
  const mx = useMatrixClient();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  const [logoutState, logout] = useAsyncCallback(
    useCallback(async () => {
      await logoutClient(mx);
    }, [mx])
  );
  const loggingOut = logoutState.status === AsyncStatus.Loading;

  const handleClose = () => {
    if (loggingOut) return;
    setConfirmingLogout(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className={css.Backdrop}
        onClick={handleClose}
      />
      <FocusTrap
        focusTrapOptions={{
          initialFocus: false,
          returnFocusOnDeactivate: false,
          onDeactivate: handleClose,
          clickOutsideDeactivates: true,
          escapeDeactivates: stopPropagation,
        }}
      >
        <div className={css.Menu} role="menu">
          <div className={css.AccountInfo}>
            <span className={css.AccountName}>{displayName ?? userId}</span>
            <span className={css.AccountId}>{userId}</span>
          </div>
          <div className={css.Divider} />

          {confirmingLogout ? (
            <>
              <div className={css.ConfirmText}>Log out of this account on this device?</div>
              {logoutState.status === AsyncStatus.Error && (
                <div className={css.ErrorText}>Failed to log out. Please try again.</div>
              )}
              <div className={css.ConfirmActions}>
                <button
                  type="button"
                  className={css.CancelButton}
                  onClick={() => setConfirmingLogout(false)}
                  disabled={loggingOut}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={css.LogoutButton}
                  onClick={logout}
                  disabled={loggingOut}
                >
                  {loggingOut ? 'Logging out…' : 'Log out'}
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={`${css.MenuItem} ${css.MenuItemCritical}`}
              onClick={() => setConfirmingLogout(true)}
            >
              {LOGOUT_ICON}
              Log out
            </button>
          )}
        </div>
      </FocusTrap>
    </>
  );
}
