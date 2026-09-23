import { style } from '@vanilla-extract/css';

export const EmptyState = style({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '32px',
  textAlign: 'center',
});

export const EmptyStateTitle = style({
  fontSize: '17px',
  fontWeight: 700,
  color: '#1e2a32',
});

export const EmptyStateSubtitle = style({
  fontSize: '14px',
  fontWeight: 500,
  color: '#7c8d97',
  maxWidth: '280px',
});

export const EmptyStateAction = style({
  marginTop: '12px',
  background: '#1596ce',
  color: '#fff',
  border: 'none',
  borderRadius: '14px',
  height: '46px',
  padding: '0 20px',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
});
