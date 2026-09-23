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
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
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
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
});

export const Description = style({
  margin: 0,
  fontSize: '15px',
  fontWeight: 500,
  color: '#5a6b74',
  lineHeight: 1.45,
});

export const Field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const Label = style({
  fontSize: '14px',
  fontWeight: 700,
  color: '#1e2a32',
});

export const Options = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const Option = style({
  textAlign: 'left',
  border: '2px solid transparent',
  background: '#fff',
  borderRadius: '16px',
  padding: '14px 16px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05), 0 10px 24px rgba(30, 42, 50, 0.05)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  selectors: {
    '&[aria-checked="true"]': {
      borderColor: '#1596ce',
    },
    '&:disabled': {
      cursor: 'default',
    },
  },
});

export const OptionTitle = style({
  fontSize: '16px',
  fontWeight: 700,
  color: '#1e2a32',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const OptionSubtitle = style({
  marginTop: '2px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#7c8d97',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const QRCard = style({
  alignSelf: 'center',
  display: 'flex',
  background: '#fff',
  borderRadius: '20px',
  padding: '18px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05), 0 10px 24px rgba(30, 42, 50, 0.05)',
});

export const Input = style({
  border: '1px solid transparent',
  background: '#fff',
  borderRadius: '14px',
  padding: '14px 16px',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 500,
  color: '#1e2a32',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: '#1596ce',
    },
  },
});

export const Error = style({
  fontSize: '14px',
  fontWeight: 600,
  color: '#c62828',
});

export const Actions = style({
  marginTop: 'auto',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
});

const buttonBase = {
  border: 'none',
  borderRadius: '16px',
  height: '52px',
  padding: '0 22px',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '16px',
  cursor: 'pointer',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
} as const;

export const SecondaryButton = style({
  ...buttonBase,
  background: '#fff',
  color: '#1596ce',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
});

export const SubmitButton = style({
  ...buttonBase,
  background: '#1596ce',
  color: '#fff',
  boxShadow: '0 8px 20px rgba(21, 150, 206, 0.4)',
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
      boxShadow: 'none',
    },
  },
});
