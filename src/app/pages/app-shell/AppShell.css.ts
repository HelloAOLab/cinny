import { globalStyle, style } from '@vanilla-extract/css';

export const Shell = style({
  fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  color: '#1e2a32',
  background: '#dce7ec',
  minHeight: '100dvh',
  // The shell sits in ClientLayout's row flexbox; without growing it would
  // shrink to its content's width instead of filling the screen.
  flexGrow: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
});

export const Header = style({
  flexShrink: 0,
  background: '#dce7ec',
  padding: '14px 18px 8px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
});

export const IconButton = style({
  border: 'none',
  background: 'transparent',
  color: '#2b3a43',
  display: 'flex',
  padding: 0,
  cursor: 'pointer',
});

export const HeaderTitle = style({
  fontSize: '22px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
});

export const HeaderSpacer = style({
  flexGrow: 1,
});

export const AvatarWrapper = style({
  position: 'relative',
  flexShrink: 0,
});

export const UserAvatarButton = style({
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: '#d7ecf6',
  color: '#0f6d9c',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '13px',
  overflow: 'hidden',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
});

export const Tabs = style({
  flexShrink: 0,
  display: 'flex',
  gap: '4px',
  padding: '4px 18px 0',
  overflowX: 'auto',
  borderBottom: '1px solid #cdd9df',
});

export const Tab = style({
  border: 'none',
  background: 'transparent',
  padding: '8px 8px 12px',
  fontSize: '16px',
  fontWeight: 600,
  color: '#7c8d97',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
});

export const TabActive = style({
  fontWeight: 800,
  color: '#1596ce',
  borderBottom: '3px solid #1596ce',
  marginBottom: '-1px',
});

export const ScrollArea = style({
  flexGrow: 1,
  overflow: 'auto',
  padding: '16px 0 96px',
  position: 'relative',
});

export const ShareFab = style({
  position: 'absolute',
  right: '18px',
  bottom: '84px',
  background: '#1596ce',
  color: '#fff',
  border: 'none',
  borderRadius: '16px',
  height: '52px',
  padding: '0 22px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontWeight: 700,
  fontSize: '16px',
  boxShadow: '0 8px 20px rgba(21, 150, 206, 0.4)',
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
      boxShadow: 'none',
    },
  },
});

export const BottomNav = style({
  flexShrink: 0,
  height: '68px',
  background: '#fff',
  borderTop: '1px solid #e2e9ee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  paddingBottom: '4px',
});

export const NavButton = style({
  border: 'none',
  background: 'transparent',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '3px',
  color: '#8a99a1',
  cursor: 'default',
  textDecoration: 'none',
});

export const NavButtonActive = style({
  color: '#1596ce',
  cursor: 'pointer',
});

export const NavButtonLabel = style({
  fontSize: '11px',
  fontWeight: 700,
});

export const NavButtonLink = style({
  cursor: 'pointer',
  fontFamily: 'inherit',
  selectors: {
    '&:disabled': {
      cursor: 'default',
      opacity: 0.5,
    },
  },
});

export const RoomArea = style({
  flexGrow: 1,
  minHeight: 0,
  height: '100dvh',
  display: 'flex',
  flexDirection: 'column',
});

/* Desktop layout: persistent sidebar next to a main column. */

export const DesktopShell = style({
  flexDirection: 'row',
  height: '100dvh',
});

export const DesktopMain = style({
  flexGrow: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
});

export const DesktopHeader = style({
  padding: '18px 28px 12px',
  gap: '16px',
});

export const DesktopHeaderCommunity = style({
  fontSize: '15px',
  fontWeight: 600,
  color: '#7c8d97',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
});

export const DesktopTabsBar = style({
  flexShrink: 0,
  borderBottom: '1px solid #cdd9df',
  padding: '0 28px',
});

// The column's own tab strip keeps its spacing but not a second border.
globalStyle(`${DesktopTabsBar} ${Tabs}`, {
  borderBottom: 'none',
  padding: '4px 4px 0',
});

export const DesktopColumn = style({
  width: '100%',
  maxWidth: '680px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  flexShrink: 0,
});

export const DesktopScrollArea = style({
  padding: '20px 28px 40px',
  display: 'flex',
  flexDirection: 'column',
});

export const DesktopChatArea = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  borderTop: '1px solid #cdd9df',
});

export const DesktopPageArea = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});
