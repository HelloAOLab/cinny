import { style } from '@vanilla-extract/css';

export const Backdrop = style({
  position: 'fixed',
  inset: 0,
  border: 'none',
  padding: 0,
  cursor: 'default',
  background: 'rgba(20, 30, 36, 0.45)',
  zIndex: 200,
});

export const Panel = style({
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  width: '78%',
  maxWidth: '320px',
  background: '#ffffff',
  zIndex: 201,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '10px 0 30px rgba(30, 42, 50, 0.15)',
});

export const Header = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '18px 18px 12px',
});

export const HeaderTitle = style({
  fontSize: '18px',
  fontWeight: 800,
  color: '#1e2a32',
});

export const CloseButton = style({
  border: 'none',
  background: 'transparent',
  color: '#2b3a43',
  display: 'flex',
  padding: '4px',
  cursor: 'pointer',
});

export const List = style({
  flexGrow: 1,
  overflowY: 'auto',
  padding: '4px 10px 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const CommunityRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  border: 'none',
  background: 'transparent',
  padding: '10px 8px',
  borderRadius: '12px',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
  selectors: {
    '&[aria-current="true"]': {
      background: '#e7f3fa',
    },
  },
});

export const CommunityAvatar = style({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  flexShrink: 0,
  background: '#d7ecf6',
  color: '#0f6d9c',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: '13px',
  overflow: 'hidden',
  objectFit: 'cover',
});

export const CommunityName = style({
  fontSize: '15px',
  fontWeight: 700,
  color: '#1e2a32',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const EmptyList = style({
  padding: '16px 8px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#7c8d97',
});
