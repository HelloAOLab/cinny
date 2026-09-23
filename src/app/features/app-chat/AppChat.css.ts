import { style } from '@vanilla-extract/css';
import { color } from 'folds';

export const Section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '0 14px',
  selectors: {
    '& + &': {
      marginTop: '22px',
    },
  },
});

export const SectionTitle = style({
  fontSize: '13px',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#7c8d97',
  padding: '0 4px 2px',
});

export const RoomItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 14px',
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
  color: 'inherit',
  textDecoration: 'none',
  minWidth: 0,
});

export const Avatar = style({
  width: '46px',
  height: '46px',
  borderRadius: '14px',
  background: '#d7ecf6',
  color: '#0f6d9c',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '14px',
  flexShrink: 0,
  overflow: 'hidden',
});

export const AvatarImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const RoomText = style({
  flexGrow: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const RoomNameRow = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
});

export const RoomName = style({
  flexGrow: 1,
  fontWeight: 700,
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const RoomNameUnread = style({
  fontWeight: 800,
});

export const Time = style({
  flexShrink: 0,
  fontSize: '12px',
  fontWeight: 600,
  color: '#8a99a1',
});

export const PreviewRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const Preview = style({
  flexGrow: 1,
  fontSize: '14px',
  color: '#7c8d97',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const PreviewUnread = style({
  color: '#2b3a43',
  fontWeight: 600,
});

export const Badge = style({
  flexShrink: 0,
  minWidth: '20px',
  height: '20px',
  padding: '0 6px',
  borderRadius: '10px',
  background: '#8a99a1',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const BadgeHighlight = style({
  background: '#1596ce',
});

export const JoinButton = style({
  flexShrink: 0,
  border: 'none',
  borderRadius: '12px',
  background: '#1596ce',
  color: '#fff',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '14px',
  padding: '8px 16px',
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      opacity: 0.6,
      cursor: 'default',
    },
  },
});

export const JoinError = style({
  fontSize: '12px',
  color: '#d64545',
});

export const RoomScreen = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  background: color.Background.Container,
  color: color.Background.OnContainer,
});

export const RoomScreenBackBar = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 14px',
  background: '#dce7ec',
  borderBottom: '1px solid #cdd9df',
});

export const BackLink = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: '#1596ce',
  fontWeight: 700,
  fontSize: '15px',
  textDecoration: 'none',
});

export const RoomScreenBody = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
});

export const RoomItemSelected = style({
  boxShadow: 'inset 0 0 0 2px #1596ce',
  background: '#f3fafd',
});

/* Desktop split view: room list beside the open room. */

export const Split = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
});

export const SplitList = style({
  flexShrink: 0,
  width: '340px',
  overflowY: 'auto',
  padding: '16px 0 24px',
  borderRight: '1px solid #cdd9df',
});

export const SplitContent = style({
  flexGrow: 1,
  minWidth: 0,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
});
