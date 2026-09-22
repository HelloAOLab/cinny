import { style } from '@vanilla-extract/css';

export const Page = style({
  fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
  color: '#1e2a32',
  background: '#dce7ec',
  minHeight: '100dvh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 18px',
  boxSizing: 'border-box',
});

export const Card = style({
  width: '100%',
  maxWidth: '380px',
  background: '#fff',
  borderRadius: '18px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05), 0 10px 24px rgba(30, 42, 50, 0.05)',
  overflow: 'hidden',
});

export const Header = style({
  padding: '24px 24px 8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const Title = style({
  fontSize: '22px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
});

export const Content = style({
  padding: '16px 24px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const FormGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
});

export const Label = style({
  fontSize: '13px',
  fontWeight: 700,
  color: '#2b3a43',
});

export const StatusText = style({
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  color: '#7c8d97',
});

export const ErrorText = style({
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  color: '#d64545',
});
