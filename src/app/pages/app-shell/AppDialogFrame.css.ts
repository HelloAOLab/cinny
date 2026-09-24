import { style } from '@vanilla-extract/css';

export const Backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 220,
  background: 'rgba(20, 30, 36, 0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
});

export const Frame = style({
  position: 'relative',
  width: '100%',
  maxWidth: '480px',
  height: 'min(760px, 100%)',
  borderRadius: '20px',
  overflow: 'hidden',
  boxShadow: '0 24px 60px rgba(20, 30, 36, 0.3)',
});
