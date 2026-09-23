import React, { useCallback, useEffect, useState } from 'react';
import FocusTrap from 'focus-trap-react';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { AsyncStatus, useAsyncCallback } from '../../hooks/useAsyncCallback';
import { getMatrixToRoomEvent } from '../../plugins/matrix-to';
import { getViaServers } from '../../plugins/via-servers';
import { copyToClipboard } from '../../utils/dom';
import { stopPropagation } from '../../utils/keyboard';
import * as css from './AppPostOptionsMenu.css';

const SHARE_ICON = (
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
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
    <path d="M16 6l-4-4-4 4" />
    <path d="M12 2v13" />
  </svg>
);

const REMOVE_ICON = (
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
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

const COPIED_CLOSE_DELAY_MS = 1200;

type AppPostOptionsMenuProps = {
  room: Room;
  event: MatrixEvent;
  canRemove: boolean;
  onClose: () => void;
};

export function AppPostOptionsMenu({ room, event, canRemove, onClose }: AppPostOptionsMenuProps) {
  const mx = useMatrixClient();
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [copied, setCopied] = useState(false);
  const eventId = event.getId();

  const [removeState, removePost] = useAsyncCallback(
    useCallback(async () => {
      if (!eventId) return;
      await mx.redactEvent(room.roomId, eventId);
    }, [mx, room, eventId])
  );
  const removing = removeState.status === AsyncStatus.Loading;

  useEffect(() => {
    if (removeState.status === AsyncStatus.Success) onClose();
  }, [removeState.status, onClose]);

  useEffect(() => {
    if (!copied) return undefined;
    const timeout = window.setTimeout(onClose, COPIED_CLOSE_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [copied, onClose]);

  const handleClose = () => {
    if (removing) return;
    onClose();
  };

  const handleShare = async () => {
    if (!eventId) return;
    const url = getMatrixToRoomEvent(room.roomId, eventId, getViaServers(room));

    // Prefer the OS share sheet (mobile/PWA); fall back to copying the link.
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: room.name, url });
        onClose();
        return;
      } catch (err) {
        // The user dismissing the share sheet isn't a failure worth a fallback.
        if (err instanceof DOMException && err.name === 'AbortError') {
          onClose();
          return;
        }
      }
    }
    copyToClipboard(url);
    setCopied(true);
  };

  return (
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
        {confirmingRemove ? (
          <>
            <div className={css.ConfirmText}>Remove this post? This can&apos;t be undone.</div>
            {removeState.status === AsyncStatus.Error && (
              <div className={css.ErrorText}>Failed to remove post. Please try again.</div>
            )}
            <div className={css.ConfirmActions}>
              <button
                type="button"
                className={css.CancelButton}
                onClick={() => setConfirmingRemove(false)}
                disabled={removing}
              >
                Cancel
              </button>
              <button
                type="button"
                className={css.RemoveButton}
                onClick={removePost}
                disabled={removing}
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </>
        ) : (
          <>
            <button type="button" role="menuitem" className={css.MenuItem} onClick={handleShare}>
              {SHARE_ICON}
              {copied ? 'Link copied' : 'Share'}
            </button>
            {canRemove && (
              <button
                type="button"
                role="menuitem"
                className={`${css.MenuItem} ${css.MenuItemCritical}`}
                onClick={() => setConfirmingRemove(true)}
              >
                {REMOVE_ICON}
                Remove
              </button>
            )}
          </>
        )}
      </div>
    </FocusTrap>
  );
}
