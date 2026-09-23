import { style } from '@vanilla-extract/css';

export const Backdrop = style({
  position: 'fixed',
  inset: 0,
  border: 'none',
  padding: 0,
  cursor: 'default',
  background: 'transparent',
  zIndex: 200,
});

export const Menu = style({
  position: 'absolute',
  top: 'calc(100% + 10px)',
  right: 0,
  minWidth: '220px',
  background: '#fff',
  borderRadius: '14px',
  boxShadow: '0 10px 30px rgba(30, 42, 50, 0.18)',
  padding: '8px',
  zIndex: 201,
});

export const AccountInfo = style({
  display: 'flex',
  flexDirection: 'column',
  padding: '8px 10px 10px',
});

export const AccountName = style({
  fontSize: '14px',
  fontWeight: 700,
  color: '#1e2a32',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const AccountId = style({
  fontSize: '12px',
  fontWeight: 500,
  color: '#8a99a1',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const Divider = style({
  height: '1px',
  background: '#eef2f5',
  margin: '4px 0',
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
});

export const ConfirmActions = style({
  display: 'flex',
  gap: '8px',
  padding: '0 4px 4px',
});

export const ConfirmButton = style({
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

export const LogoutButton = style([
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
