import { style } from '@vanilla-extract/css';

export const Overlay = style({
  position: 'absolute',
  inset: 0,
  background: '#dce7ec',
  zIndex: 220,
  display: 'flex',
  flexDirection: 'column',
});

export const Header = style({
  flexShrink: 0,
  padding: '14px 18px 8px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
});

export const HeaderButton = style({
  border: 'none',
  background: 'transparent',
  color: '#2b3a43',
  display: 'flex',
  padding: 0,
  cursor: 'pointer',
});

export const HeaderTitle = style({
  fontSize: '18px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
});

export const HeaderSpacer = style({
  flexGrow: 1,
});

export const Body = style({
  flexGrow: 1,
  overflow: 'auto',
  padding: '12px 18px 24px',
});
