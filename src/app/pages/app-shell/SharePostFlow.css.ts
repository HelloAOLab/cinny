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

export const HeaderSpacer = style({
  flexGrow: 1,
});

export const Body = style({
  flexGrow: 1,
  overflow: 'auto',
  padding: '12px 18px 24px',
  display: 'flex',
  flexDirection: 'column',
});

export const Question = style({
  fontSize: '22px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
  margin: '8px 0 20px',
  lineHeight: 1.3,
});

export const Options = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const Option = style({
  textAlign: 'left',
  border: 'none',
  background: '#fff',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05), 0 10px 24px rgba(30, 42, 50, 0.05)',
  cursor: 'pointer',
});

export const OptionTitle = style({
  fontSize: '16px',
  fontWeight: 700,
  color: '#1e2a32',
});

export const OptionSubtitle = style({
  marginTop: '2px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#7c8d97',
});
