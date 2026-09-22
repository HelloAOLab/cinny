import { style } from '@vanilla-extract/css';

export const Card = style({
  margin: '0 14px',
  background: '#fff',
  borderRadius: '18px',
  overflow: 'hidden',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05), 0 10px 24px rgba(30, 42, 50, 0.05)',
});

export const CardHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '11px',
  padding: '14px 16px',
});

export const Avatar = style({
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  background: '#f0d9a8',
  color: '#8a6a1f',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '13px',
  flexShrink: 0,
  overflow: 'hidden',
});

export const CardHeaderText = style({
  flexGrow: 1,
  minWidth: 0,
});

export const RoomName = style({
  fontWeight: 700,
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const SenderLine = style({
  color: '#8a99a1',
  fontSize: '13px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const OptionsButton = style({
  border: 'none',
  background: 'transparent',
  color: '#8a99a1',
  display: 'flex',
  padding: '4px',
  cursor: 'default',
  flexShrink: 0,
});

export const CoverImage = style({
  height: '250px',
  position: 'relative',
  background: '#eef2f5',
});

export const Body = style({
  padding: '14px 16px 10px',
  fontSize: '15px',
  lineHeight: 1.55,
  color: '#2b3a43',
});

export const ReactionsRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  padding: '4px 16px 12px',
});

export const ReactionBadges = style({
  display: 'flex',
});

export const ReactionBadge = style({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '2px solid #fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  selectors: {
    '& + &': {
      marginLeft: '-7px',
    },
  },
});

export const ReactionCount = style({
  color: '#6b7c85',
  fontSize: '13px',
  fontWeight: 600,
});

export const ReactionsSpacer = style({
  flexGrow: 1,
});

export const CommentCount = style({
  color: '#8a99a1',
  fontSize: '13px',
  fontWeight: 600,
});

export const ActionBar = style({
  display: 'flex',
  borderTop: '1px solid #eef2f5',
});

export const ActionButton = style({
  flexGrow: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  border: 'none',
  background: 'transparent',
  padding: '12px',
  color: '#5a6b74',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'default',
});

export const ActionButtonDivider = style({
  borderLeft: '1px solid #eef2f5',
});
