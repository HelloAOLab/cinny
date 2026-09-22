import { style } from '@vanilla-extract/css';

export const Stories = style({
  display: 'flex',
  gap: '12px',
  padding: '0 18px 18px',
  overflowX: 'auto',
});

export const StoryTile = style({
  width: '118px',
  height: '158px',
  borderRadius: '16px',
  position: 'relative',
  flexShrink: 0,
  display: 'block',
  background: '#d8e6d2',
  border: 'none',
  padding: 0,
  cursor: 'default',
});

export const StoryPlayButton = style({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const Posts = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});
