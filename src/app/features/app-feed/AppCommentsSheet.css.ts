import { style } from '@vanilla-extract/css';

export const Backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 220,
  background: 'rgba(30, 42, 50, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
});

export const Sheet = style({
  height: '85dvh',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '18px 18px 0 0',
  overflow: 'hidden',
  boxShadow: '0 -10px 30px rgba(30, 42, 50, 0.15)',
});

export const Panel = style({
  width: '100%',
  maxWidth: 'none',
  borderInlineStartWidth: 0,
  flexGrow: 1,
  minHeight: 0,
});
