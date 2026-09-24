import { describe, expect, it } from 'vitest';
import { MOBILE_BREAKPOINT, ScreenSize, getScreenSize } from '../../hooks/useScreenSize';
import { APP_DESKTOP_MEDIA, isAppChatSplitLayout, isAppDesktopLayout } from './appLayout';

describe('isAppDesktopLayout', () => {
  it('uses the mobile layout only on mobile screens', () => {
    expect(isAppDesktopLayout(ScreenSize.Mobile)).toBe(false);
    expect(isAppDesktopLayout(ScreenSize.Tablet)).toBe(true);
    expect(isAppDesktopLayout(ScreenSize.Desktop)).toBe(true);
  });
});

describe('isAppChatSplitLayout', () => {
  it('splits the chat tab only on desktop screens', () => {
    expect(isAppChatSplitLayout(ScreenSize.Mobile)).toBe(false);
    expect(isAppChatSplitLayout(ScreenSize.Tablet)).toBe(false);
    expect(isAppChatSplitLayout(ScreenSize.Desktop)).toBe(true);
  });
});

describe('APP_DESKTOP_MEDIA', () => {
  it('starts at the first width that is not a mobile screen size', () => {
    const minWidth = Number(APP_DESKTOP_MEDIA.match(/min-width: (\d+)px/)?.[1]);
    expect(isAppDesktopLayout(getScreenSize(minWidth))).toBe(true);
    expect(isAppDesktopLayout(getScreenSize(minWidth - 1))).toBe(false);
    expect(minWidth).toBe(MOBILE_BREAKPOINT + 1);
  });
});
