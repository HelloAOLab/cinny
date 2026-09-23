import { style } from '@vanilla-extract/css';

export const Screen = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  background: '#dce7ec',
});

export const Header = style({
  flexShrink: 0,
  padding: '14px 18px 10px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderBottom: '1px solid #cdd9df',
});

export const BackLink = style({
  display: 'flex',
  color: '#2b3a43',
});

export const HeaderTitle = style({
  fontSize: '20px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
});

export const Body = style({
  flexGrow: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: '16px 14px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
});

export const Section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const SectionTitle = style({
  fontSize: '13px',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#7c8d97',
  padding: '0 4px 2px',
});

export const Card = style({
  background: '#fff',
  borderRadius: '16px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
});

export const AvatarRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

export const AvatarActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '10px',
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

export const AvatarRound = style({
  borderRadius: '50%',
});

export const LargeAvatar = style([
  Avatar,
  {
    width: '80px',
    height: '80px',
    borderRadius: '22px',
    fontSize: '24px',
  },
]);

export const AvatarImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const Field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const Label = style({
  fontSize: '14px',
  fontWeight: 700,
  color: '#1e2a32',
});

export const InputRow = style({
  display: 'flex',
  gap: '10px',
});

export const Input = style({
  flexGrow: 1,
  minWidth: 0,
  border: '1px solid #dce7ec',
  background: '#f4f8fa',
  borderRadius: '14px',
  padding: '12px 14px',
  fontFamily: 'inherit',
  fontSize: '16px',
  fontWeight: 500,
  color: '#1e2a32',
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: '#1596ce',
    },
  },
});

const buttonBase = {
  flexShrink: 0,
  border: 'none',
  borderRadius: '12px',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '14px',
  padding: '10px 16px',
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
} as const;

export const PrimaryButton = style({
  ...buttonBase,
  background: '#1596ce',
  color: '#fff',
});

export const SecondaryButton = style({
  ...buttonBase,
  background: '#d7ecf6',
  color: '#0f6d9c',
});

export const DangerTextButton = style({
  ...buttonBase,
  background: 'transparent',
  color: '#c62828',
  padding: '10px 4px',
});

export const Options = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
});

export const Option = style({
  textAlign: 'left',
  border: '2px solid transparent',
  background: '#fff',
  borderRadius: '16px',
  padding: '14px 16px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
  cursor: 'pointer',
  fontFamily: 'inherit',
  selectors: {
    '&[aria-checked="true"]': {
      borderColor: '#1596ce',
    },
    '&:disabled': {
      cursor: 'default',
    },
    '&:disabled:not([aria-checked="true"])': {
      opacity: 0.6,
    },
  },
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

export const Row = style({
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

export const RowText = style({
  flexGrow: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const RowTitle = style({
  fontWeight: 700,
  fontSize: '16px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const RowSubtitle = style({
  fontSize: '13px',
  color: '#7c8d97',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const You = style({
  fontWeight: 500,
  color: '#7c8d97',
});

export const Tag = style({
  flexShrink: 0,
  fontSize: '12px',
  fontWeight: 700,
  color: '#0f6d9c',
  background: '#d7ecf6',
  borderRadius: '8px',
  padding: '3px 8px',
});

export const Hint = style({
  fontSize: '14px',
  fontWeight: 500,
  color: '#7c8d97',
  padding: '0 4px',
});

export const Error = style({
  fontSize: '14px',
  fontWeight: 600,
  color: '#c62828',
  padding: '0 4px',
});
