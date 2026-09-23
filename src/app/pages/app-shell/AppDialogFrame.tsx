import React, { ReactNode } from 'react';
import * as css from './AppDialogFrame.css';

type AppDialogFrameProps = {
  /** When false the children render as-is (full-screen sheets on mobile). */
  desktop: boolean;
  children: ReactNode;
};

/**
 * Hosts one of the /app shell's full-screen flows (share, create community,
 * invite...). Those flows fill their nearest positioned ancestor, so on
 * desktop this frame gives them a centered, phone-sized dialog over a dimmed
 * backdrop instead of letting them cover the whole window.
 */
export function AppDialogFrame({ desktop, children }: AppDialogFrameProps) {
  // eslint-disable-next-line react/jsx-no-useless-fragment -- narrows ReactNode to an element
  if (!desktop) return <>{children}</>;

  return (
    <div className={css.Backdrop}>
      <div className={css.Frame}>{children}</div>
    </div>
  );
}
