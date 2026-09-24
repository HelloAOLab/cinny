import { style } from '@vanilla-extract/css';

export const Sidebar = style({
  flexShrink: 0,
  width: '272px',
  height: '100%',
  background: '#ffffff',
  borderRight: '1px solid #e2e9ee',
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
});

export const Top = style({
  flexShrink: 0,
  padding: '18px 14px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
});

export const Nav = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const NavItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  border: 'none',
  background: 'transparent',
  padding: '10px 12px',
  borderRadius: '12px',
  fontFamily: 'inherit',
  fontSize: '15px',
  fontWeight: 700,
  color: '#5f717b',
  textAlign: 'left',
  cursor: 'default',
});

export const NavItemLink = style({
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled)': {
      background: '#f1f6f9',
    },
    '&:disabled': {
      cursor: 'default',
      opacity: 0.5,
    },
  },
});

export const NavItemActive = style({
  color: '#1596ce',
  background: '#e7f3fa',
  selectors: {
    '&:hover:not(:disabled)': {
      background: '#e7f3fa',
    },
  },
});

export const NavItemIcon = style({
  width: '26px',
  display: 'flex',
  justifyContent: 'center',
});

export const SectionTitle = style({
  flexShrink: 0,
  padding: '14px 24px 6px',
  borderTop: '1px solid #e2e9ee',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#7c8d97',
});

export const Communities = style({
  flexGrow: 1,
  minHeight: 0,
  overflowY: 'auto',
  padding: '0 10px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
});

export const Footer = style({
  flexShrink: 0,
  padding: '8px 10px 14px',
  borderTop: '1px solid #e2e9ee',
});
