import { MatrixEvent } from 'matrix-js-sdk';

export type PostType = 'prayer' | 'praise' | 'baptism' | 'salvation';

export const POST_TYPE_KEY = 'm.post.type';

export type PostTypeOption = {
  value: PostType;
  label: string;
  subtitle: string;
  /** Label of the home-screen tab that lists posts of this type. */
  tabLabel: string;
};

export const POST_TYPE_OPTIONS: PostTypeOption[] = [
  {
    value: 'prayer',
    label: 'Prayer',
    subtitle: 'Ask others to pray with you',
    tabLabel: 'Prayer',
  },
  {
    value: 'praise',
    label: 'Praise',
    subtitle: 'Share something to celebrate',
    tabLabel: 'Praise',
  },
  {
    value: 'baptism',
    label: 'Baptism',
    subtitle: 'Share a baptism',
    tabLabel: 'Baptisms',
  },
  {
    value: 'salvation',
    label: 'Story of Salvation',
    subtitle: 'Share how someone came to faith',
    tabLabel: 'Salvation',
  },
];

const POST_TYPES = new Set<string>(POST_TYPE_OPTIONS.map((option) => option.value));

export const isPostType = (value: unknown): value is PostType =>
  typeof value === 'string' && POST_TYPES.has(value);

/** Reads `m.post.type` from a post's content, ignoring unknown values. */
export const getPostType = (content: Record<string, unknown>): PostType | undefined => {
  const value = content[POST_TYPE_KEY];
  return isPostType(value) ? value : undefined;
};

/**
 * Keeps only posts of the given type. An undefined filter (the "All" tab)
 * keeps every post, including ones sent without a type.
 */
export const filterPostsByType = <T extends { event: MatrixEvent }>(
  posts: T[],
  postType: PostType | undefined
): T[] =>
  postType ? posts.filter((post) => getPostType(post.event.getContent()) === postType) : posts;
