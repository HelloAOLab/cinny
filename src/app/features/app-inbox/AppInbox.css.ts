import { style } from '@vanilla-extract/css';
import { color } from 'folds';

export const Screen = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  background: color.Background.Container,
  color: color.Background.OnContainer,
});

export const Tabs = style({
  flexShrink: 0,
  display: 'flex',
  gap: '4px',
  padding: '4px 18px 0',
  background: '#dce7ec',
  borderBottom: '1px solid #cdd9df',
});

export const Tab = style({
  border: 'none',
  background: 'transparent',
  padding: '8px 8px 12px',
  fontFamily: 'inherit',
  fontSize: '16px',
  fontWeight: 600,
  color: '#7c8d97',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

export const TabActive = style({
  fontWeight: 800,
  color: '#1596ce',
  borderBottom: '3px solid #1596ce',
  marginBottom: '-1px',
});

export const TabBadge = style({
  minWidth: '20px',
  height: '20px',
  padding: '0 6px',
  borderRadius: '10px',
  background: '#1596ce',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const Body = style({
  flexGrow: 1,
  minHeight: 0,
  display: 'flex',
});
