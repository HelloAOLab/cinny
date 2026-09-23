import { keyframes, style } from '@vanilla-extract/css';

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

export const Heading = style({
  fontSize: '18px',
  fontWeight: 800,
  color: '#1e2a32',
  margin: '0 0 4px',
});

export const ErrorText = style({
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 600,
  color: '#d64545',
});

export const Form = style({
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

export const InputRow = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

export const Input = style({
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #cdd9df',
  borderRadius: '12px',
  padding: '12px 14px',
  fontSize: '15px',
  fontFamily: 'inherit',
  color: '#1e2a32',
  background: '#fff',
  selectors: {
    '&:focus': {
      outline: 'none',
      borderColor: '#1596ce',
    },
  },
});

export const InputWithButton = style([
  Input,
  {
    paddingRight: '44px',
  },
]);

export const InputIconButton = style({
  position: 'absolute',
  right: '6px',
  border: 'none',
  background: 'transparent',
  color: '#7c8d97',
  display: 'flex',
  padding: '6px',
  cursor: 'pointer',
});

export const SubmitButton = style({
  border: 'none',
  borderRadius: '12px',
  padding: '14px',
  background: '#1596ce',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  selectors: {
    '&:disabled': {
      opacity: 0.6,
      cursor: 'default',
    },
  },
});

export const HelperText = style({
  textAlign: 'center',
  fontSize: '13px',
  fontWeight: 500,
  color: '#7c8d97',
});

export const HelperLink = style({
  color: '#1596ce',
  fontWeight: 700,
  textDecoration: 'none',
});

export const LoadingOverlay = style({
  position: 'fixed',
  inset: 0,
  background: 'rgba(220, 231, 236, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  gap: '12px',
  zIndex: 300,
});

export const Spinner = style({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: '3px solid #cfe1ea',
  borderTopColor: '#1596ce',
  animation: `${spin} 0.8s linear infinite`,
});

export const LoadingText = style({
  fontSize: '14px',
  fontWeight: 600,
  color: '#2b3a43',
});
