import React, { MouseEventHandler } from 'react';
import FocusTrap from 'focus-trap-react';
import { MatrixEvent, Room } from 'matrix-js-sdk';
import { CommentsPanel } from '../feed/comments/CommentsPanel';
import { stopPropagation } from '../../utils/keyboard';
import { LightTheme } from '../../hooks/useTheme';
import * as css from './AppCommentsSheet.css';

// CommentsPanel styles itself with folds' theme tokens, which follow the
// user's selected app theme. /app's chrome is always light, so force the
// light theme here the same way SharePostComposer does.
const LIGHT_THEME_CLASS_NAME = LightTheme.classNames.join(' ');

type AppCommentsSheetProps = {
  room: Room;
  postEvent: MatrixEvent;
  onClose: () => void;
};

export function AppCommentsSheet({ room, postEvent, onClose }: AppCommentsSheetProps) {
  const handleBackdropClick: MouseEventHandler<HTMLDivElement> = (evt) => {
    if (evt.target === evt.currentTarget) onClose();
  };

  return (
    <FocusTrap
      focusTrapOptions={{
        initialFocus: false,
        returnFocusOnDeactivate: false,
        onDeactivate: onClose,
        // Popouts (emoji board, message menus) render in portals outside the
        // sheet, so outside clicks must not tear the trap down.
        clickOutsideDeactivates: false,
        allowOutsideClick: true,
        escapeDeactivates: stopPropagation,
      }}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className={css.Backdrop} onClick={handleBackdropClick}>
        <div
          className={`${css.Sheet} ${LIGHT_THEME_CLASS_NAME}`}
          role="dialog"
          aria-label="Comments"
        >
          <CommentsPanel
            className={css.Panel}
            room={room}
            postEvent={postEvent}
            requestClose={onClose}
          />
        </div>
      </div>
    </FocusTrap>
  );
}
