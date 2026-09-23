import { POST_TYPE_KEY, PostType } from './postType';

export type PostSharingLevel = 'public' | 'anonymous' | 'private';

/**
 * Merges the post-sharing consent flags and post type onto a message content
 * object. `m.post` is always set; the other fields are included only when a
 * value was actually collected for them (e.g. the desktop "Share" flow,
 * which has no consent gate or type picker, sends posts without them).
 */
export const applyPostSharing = (
  content: Record<string, unknown>,
  sharing?: PostSharingLevel,
  sharingMedia?: PostSharingLevel,
  postType?: PostType
): Record<string, unknown> => ({
  ...content,
  'm.post': true,
  ...(sharing ? { 'm.post.sharing': sharing } : {}),
  ...(sharingMedia ? { 'm.post.sharing.media': sharingMedia } : {}),
  ...(postType ? { [POST_TYPE_KEY]: postType } : {}),
});
