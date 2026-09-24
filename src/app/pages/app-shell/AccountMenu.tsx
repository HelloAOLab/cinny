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

const INVITE_ICON = (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

const SETTINGS_ICON = (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

type AccountMenuProps = {
  open: boolean;
  displayName?: string;
  userId: string;
  /** Opens the invite flow; the menu item is hidden when omitted. */
  onInvite?: () => void;
  onOpenSettings: () => void;
  onClose: () => void;
};

export function AccountMenu({
  open,
  displayName,
  userId,
  onInvite,
  onOpenSettings,
  onClose,
}: AccountMenuProps) {
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
            <>
              {onInvite && (
                <button
                  type="button"
                  role="menuitem"
                  className={css.MenuItem}
                  onClick={() => {
                    onClose();
                    onInvite();
                  }}
                >
                  {INVITE_ICON}
                  Invite people
                </button>
              )}
              <button
                type="button"
                role="menuitem"
                className={css.MenuItem}
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                {SETTINGS_ICON}
                Account settings
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${css.MenuItem} ${css.MenuItemCritical}`}
                onClick={() => setConfirmingLogout(true)}
              >
                {LOGOUT_ICON}
                Log out
              </button>
            </>
          )}
        </div>
      </FocusTrap>
    </>
  );
}
