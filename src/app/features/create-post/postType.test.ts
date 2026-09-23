import { describe, expect, it } from 'vitest';
import { MatrixEvent } from 'matrix-js-sdk';
import { filterPostsByType, getPostType, isPostType, POST_TYPE_OPTIONS } from './postType';

const post = (content: Record<string, unknown>) => ({
  event: new MatrixEvent({ type: 'm.room.message', content }),
});

describe('POST_TYPE_OPTIONS', () => {
  it('lists the four post types in order', () => {
    expect(POST_TYPE_OPTIONS.map((option) => option.label)).toEqual([
      'Prayer',
      'Praise',
      'Baptism',
      'Story of Salvation',
    ]);
  });
});

describe('isPostType', () => {
  it('accepts known post types', () => {
    expect(isPostType('baptism')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isPostType('other')).toBe(false);
    expect(isPostType(undefined)).toBe(false);
    expect(isPostType(1)).toBe(false);
  });
});

describe('getPostType', () => {
  it('reads m.post.type from content', () => {
    expect(getPostType({ 'm.post.type': 'praise' })).toBe('praise');
  });

  it('returns undefined for missing or unknown types', () => {
    expect(getPostType({})).toBeUndefined();
    expect(getPostType({ 'm.post.type': 'nope' })).toBeUndefined();
  });
});

describe('filterPostsByType', () => {
  const prayer = post({ 'm.post.type': 'prayer' });
  const praise = post({ 'm.post.type': 'praise' });
  const untyped = post({});
  const posts = [prayer, praise, untyped];

  it('keeps every post when no type is selected', () => {
    expect(filterPostsByType(posts, undefined)).toEqual(posts);
  });

  it('keeps only posts of the selected type', () => {
    expect(filterPostsByType(posts, 'praise')).toEqual([praise]);
  });

  it('returns nothing when no posts match', () => {
    expect(filterPostsByType(posts, 'salvation')).toEqual([]);
  });
});
