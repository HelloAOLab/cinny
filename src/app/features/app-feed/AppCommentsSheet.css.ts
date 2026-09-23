import { style } from '@vanilla-extract/css';
import { APP_DESKTOP_MEDIA } from '../../pages/app-shell/appLayout';

export const Backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 220,
  background: 'rgba(30, 42, 50, 0.35)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  '@media': {
    [APP_DESKTOP_MEDIA]: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    },
  },
});

export const Sheet = style({
  height: '85dvh',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '18px 18px 0 0',
  overflow: 'hidden',
  boxShadow: '0 -10px 30px rgba(30, 42, 50, 0.15)',
  '@media': {
    [APP_DESKTOP_MEDIA]: {
      width: '100%',
      maxWidth: '560px',
      height: 'min(760px, 100%)',
      borderRadius: '20px',
      boxShadow: '0 24px 60px rgba(20, 30, 36, 0.3)',
    },
  },
});

export const Panel = style({
  width: '100%',
  maxWidth: 'none',
  borderInlineStartWidth: 0,
  flexGrow: 1,
  minHeight: 0,
});
