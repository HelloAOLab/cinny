import { style } from '@vanilla-extract/css';

export const Menu = style({
  minWidth: '200px',
  background: '#fff',
  borderRadius: '14px',
  boxShadow: '0 10px 30px rgba(30, 42, 50, 0.18)',
  padding: '8px',
});

export const MenuItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  width: '100%',
  border: 'none',
  background: 'transparent',
  borderRadius: '10px',
  padding: '10px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#2b3a43',
  cursor: 'pointer',
  textAlign: 'left',
  selectors: {
    '&:hover, &:focus-visible': {
      background: '#f4f7f9',
    },
  },
});

export const MenuItemCritical = style({
  color: '#d64545',
});

export const ConfirmText = style({
  padding: '4px 10px 10px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#5a6b74',
  lineHeight: 1.4,
  maxWidth: '240px',
});

export const ConfirmActions = style({
  display: 'flex',
  gap: '8px',
  padding: '0 4px 4px',
});

const ConfirmButton = style({
  flexGrow: 1,
  border: 'none',
  borderRadius: '10px',
  padding: '10px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
});

export const CancelButton = style([
  ConfirmButton,
  {
    background: '#eef2f5',
    color: '#2b3a43',
  },
]);

export const RemoveButton = style([
  ConfirmButton,
  {
    background: '#d64545',
    color: '#fff',
  },
]);

export const ErrorText = style({
  padding: '0 10px 8px',
  fontSize: '12px',
  fontWeight: 600,
  color: '#d64545',
});
