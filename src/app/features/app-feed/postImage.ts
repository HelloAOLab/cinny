import { IContent } from 'matrix-js-sdk';

const DEFAULT_ASPECT_RATIO = 4 / 3;
// Keep extreme panoramas from collapsing into a sliver; tall images are
// bounded by the cover's max-height instead.
const MIN_ASPECT_RATIO = 1 / 2;
const MAX_ASPECT_RATIO = 3;

/**
 * Width/height ratio for an image post's cover, from the image's `info`
 * dimensions when present, clamped so odd sizes still render sensibly.
 */
export const getPostImageAspectRatio = (info?: { w?: unknown; h?: unknown }): number => {
  const w = info?.w;
  const h = info?.h;
  if (typeof w !== 'number' || typeof h !== 'number' || w <= 0 || h <= 0) {
    return DEFAULT_ASPECT_RATIO;
  }
  return Math.min(MAX_ASPECT_RATIO, Math.max(MIN_ASPECT_RATIO, w / h));
};

/**
 * Whether an image event carries caption text: per the Matrix spec, `body` is
 * a caption when `filename` is present and differs from it.
 */
export const hasImageCaption = (content: IContent): boolean =>
  typeof content.body === 'string' &&
  content.body.trim() !== '' &&
  typeof content.filename === 'string' &&
  content.filename !== content.body;
