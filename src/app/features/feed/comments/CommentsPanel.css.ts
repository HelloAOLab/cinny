import { style } from '@vanilla-extract/css';
import { config, toRem } from 'folds';

export const CommentsPanel = style({
  width: toRem(360),
  maxWidth: '100vw',
  height: '100%',
  borderInlineStartWidth: config.borderWidth.B300,
});

export const CommentsPanelHeader = style({
  flexShrink: 0,
  padding: `0 ${config.space.S200} 0 ${config.space.S300}`,
  borderBottomWidth: config.borderWidth.B300,
});

export const CommentsPanelContent = style({
  position: 'relative',
  overflow: 'hidden',
});

export const CommentsList = style({
  padding: `${config.space.S200} 0`,
});

export const CommentsPanelFooter = style({
  flexShrink: 0,
  padding: config.space.S300,
  borderTopWidth: config.borderWidth.B300,
});
