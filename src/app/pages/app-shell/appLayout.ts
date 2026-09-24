import { MOBILE_BREAKPOINT, ScreenSize } from '../../hooks/useScreenSize';

/**
 * Media query matching the widths where the /app shell switches from its
 * mobile layout (drawer + bottom nav) to its desktop layout (persistent
 * sidebar). Kept in sync with `isAppDesktopLayout` for use in `.css.ts` files.
 */
export const APP_DESKTOP_MEDIA = `screen and (min-width: ${MOBILE_BREAKPOINT + 1}px)`;

/** Whether the /app shell shows its desktop layout (sidebar, centered content). */
export const isAppDesktopLayout = (screenSize: ScreenSize): boolean =>
  screenSize !== ScreenSize.Mobile;

/**
 * Whether the chat tab shows the room list and the open room side by side.
 * Only on wide screens: on tablets there isn't room for both next to the sidebar.
 */
export const isAppChatSplitLayout = (screenSize: ScreenSize): boolean =>
  screenSize === ScreenSize.Desktop;
