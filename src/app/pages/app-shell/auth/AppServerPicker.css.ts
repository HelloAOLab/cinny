import { style } from '@vanilla-extract/css';

export const Wrapper = style({
  position: 'relative',
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
  padding: '12px 40px 12px 14px',
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

export const ToggleButton = style({
  position: 'absolute',
  right: '6px',
  border: 'none',
  background: 'transparent',
  color: '#7c8d97',
  display: 'flex',
  padding: '6px',
  cursor: 'pointer',
});

export const List = style({
  position: 'absolute',
  top: 'calc(100% + 6px)',
  left: 0,
  right: 0,
  background: '#fff',
  borderRadius: '12px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05), 0 10px 24px rgba(30, 42, 50, 0.1)',
  padding: '6px',
  maxHeight: '220px',
  overflowY: 'auto',
  zIndex: 10,
});

export const ListItem = style({
  display: 'block',
  width: '100%',
  textAlign: 'left',
  border: 'none',
  background: 'transparent',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#1e2a32',
  cursor: 'pointer',
  selectors: {
    '&:hover': {
      background: '#eef4f7',
    },
  },
});
