import React from 'react';
import FocusTrap from 'focus-trap-react';
import { CreatePostForm } from '../../features/create-post';
import { PostSharingLevel } from '../../features/create-post/postSharing';
import { stopPropagation } from '../../utils/keyboard';
import { LightTheme } from '../../hooks/useTheme';
import * as css from './SharePostComposer.css';

// CreatePostForm is shared with the desktop composer and styles itself
// with folds' theme tokens, which follow the user's selected app theme
// (light/dark/etc). This page's own chrome is always light to match the
// rest of /app, so the form is forced to the light theme too - otherwise
// a dark-theme user sees a light page with dark form controls inside it.
const LIGHT_THEME_CLASS_NAME = LightTheme.classNames.join(' ');

const CLOSE_ICON = (
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
);

type SharePostComposerProps = {
  open: boolean;
  defaultSpaceId?: string;
  sharing?: PostSharingLevel;
  sharingMedia?: PostSharingLevel;
  onClose: () => void;
};

export function SharePostComposer({
  open,
  defaultSpaceId,
  sharing,
  sharingMedia,
  onClose,
}: SharePostComposerProps) {
  if (!open) return null;

  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,
        returnFocusOnDeactivate: false,
        onDeactivate: onClose,
        clickOutsideDeactivates: false,
        escapeDeactivates: stopPropagation,
      }}
    >
      <div className={css.Overlay} role="dialog" aria-label="New post">
        <div className={css.Header}>
          <button
            type="button"
            aria-label="Cancel post"
            className={css.HeaderButton}
            onClick={onClose}
          >
            {CLOSE_ICON}
          </button>
          <div className={css.HeaderSpacer} />
          <span className={css.HeaderTitle}>New Post</span>
          <div className={css.HeaderSpacer} />
        </div>
        <div className={`${css.Body} ${LIGHT_THEME_CLASS_NAME}`}>
          <CreatePostForm
            pickerMode="space"
            defaultSpaceId={defaultSpaceId}
            sharing={sharing}
            sharingMedia={sharingMedia}
            onCreate={onClose}
          />
        </div>
      </div>
    </FocusTrap>
  );
}
