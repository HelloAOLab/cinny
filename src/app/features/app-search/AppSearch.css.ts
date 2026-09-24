import { style } from '@vanilla-extract/css';

export const Screen = style({
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  minWidth: 0,
});

export const SearchBar = style({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  background: '#dce7ec',
  padding: '0 14px 12px',
});

export const SearchField = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  height: '48px',
  padding: '0 14px',
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
  color: '#7c8d97',
  selectors: {
    '&:focus-within': {
      boxShadow: '0 0 0 2px #1596ce',
    },
  },
});

export const SearchInput = style({
  flexGrow: 1,
  minWidth: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: '16px',
  fontWeight: 500,
  color: '#1e2a32',
  selectors: {
    '&::placeholder': {
      color: '#8a99a1',
    },
    '&::-webkit-search-cancel-button': {
      display: 'none',
    },
  },
});

export const ClearButton = style({
  border: 'none',
  background: 'transparent',
  color: '#7c8d97',
  fontFamily: 'inherit',
  fontSize: '14px',
  fontWeight: 700,
  padding: '4px',
  cursor: 'pointer',
});

export const Results = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '26px',
  padding: '4px 14px 0',
});

export const CommunityGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const CommunityHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  minWidth: 0,
});

export const CommunityAvatar = style({
  width: '32px',
  height: '32px',
  borderRadius: '10px',
  background: '#d7ecf6',
  color: '#0f6d9c',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '12px',
  flexShrink: 0,
  overflow: 'hidden',
});

export const CommunityAvatarImage = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const CommunityName = style({
  fontSize: '18px',
  fontWeight: 800,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
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

export const ResultItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  width: '100%',
  padding: '12px 14px',
  background: '#fff',
  border: 'none',
  borderRadius: '16px',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
  color: 'inherit',
  fontFamily: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  minWidth: 0,
  selectors: {
    '&:hover': {
      boxShadow: '0 2px 8px rgba(30, 42, 50, 0.1)',
    },
  },
});

export const ResultMeta = style({
  display: 'flex',
  alignItems: 'baseline',
  gap: '6px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#7c8d97',
  minWidth: 0,
});

export const ResultSender = style({
  fontWeight: 700,
  color: '#1e2a32',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexShrink: 1,
  minWidth: 0,
});

export const ResultRoom = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexShrink: 1,
  minWidth: 0,
});

export const ResultTime = style({
  marginLeft: 'auto',
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

export const ResultTag = style({
  flexShrink: 0,
  padding: '1px 8px',
  borderRadius: '8px',
  background: '#d7ecf6',
  color: '#0f6d9c',
  fontSize: '12px',
  fontWeight: 700,
});

export const ResultBody = style({
  fontSize: '15px',
  fontWeight: 500,
  lineHeight: 1.4,
  color: '#2b3a43',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  wordBreak: 'break-word',
});

export const Highlight = style({
  background: '#fdeaa8',
  color: 'inherit',
  borderRadius: '3px',
  padding: '0 1px',
});

export const Footer = style({
  display: 'flex',
  justifyContent: 'center',
  padding: '8px 14px 0',
});

export const LoadMoreButton = style({
  background: '#fff',
  color: '#1596ce',
  border: 'none',
  borderRadius: '14px',
  height: '44px',
  padding: '0 22px',
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: '15px',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(30, 42, 50, 0.05)',
  selectors: {
    '&:disabled': {
      opacity: 0.6,
      cursor: 'default',
    },
  },
});
