import { style } from '@vanilla-extract/css';
import { config } from 'folds';

export const CreatePostFab = style({
  position: 'absolute',
  bottom: config.space.S400,
  insetInlineEnd: config.space.S400,
  zIndex: config.zIndex.Z100,
});
