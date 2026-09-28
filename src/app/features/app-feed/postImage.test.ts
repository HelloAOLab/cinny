import { describe, expect, it } from 'vitest';
import { getPostImageAspectRatio, hasImageCaption } from './postImage';

describe('getPostImageAspectRatio', () => {
  it('uses the image dimensions', () => {
    expect(getPostImageAspectRatio({ w: 1600, h: 1200 })).toBeCloseTo(4 / 3);
  });

  it('falls back to 4:3 when dimensions are missing or invalid', () => {
    expect(getPostImageAspectRatio(undefined)).toBeCloseTo(4 / 3);
    expect(getPostImageAspectRatio({ w: 100 })).toBeCloseTo(4 / 3);
    expect(getPostImageAspectRatio({ w: 0, h: 100 })).toBeCloseTo(4 / 3);
    expect(getPostImageAspectRatio({ w: '100', h: '100' })).toBeCloseTo(4 / 3);
  });

  it('clamps extreme ratios', () => {
    expect(getPostImageAspectRatio({ w: 5000, h: 100 })).toBe(3);
    expect(getPostImageAspectRatio({ w: 100, h: 5000 })).toBe(0.5);
  });
});

describe('hasImageCaption', () => {
  it('is true when body differs from filename', () => {
    expect(hasImageCaption({ body: 'Look at this', filename: 'river.jpg' })).toBe(true);
  });

  it('is false when body is just the filename', () => {
    expect(hasImageCaption({ body: 'river.jpg', filename: 'river.jpg' })).toBe(false);
  });

  it('is false without a filename or with an empty body', () => {
    expect(hasImageCaption({ body: 'river.jpg' })).toBe(false);
    expect(hasImageCaption({ body: '  ', filename: 'river.jpg' })).toBe(false);
  });
});
