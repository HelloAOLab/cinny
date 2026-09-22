export type PostSharingLevel = 'public' | 'anonymous' | 'private';

/**
 * Merges the post-sharing consent flags onto a message content object.
 * `m.post` is always set; the two sharing fields are included only when a
 * value was actually collected for them (e.g. the desktop "Share" flow,
 * which has no consent gate, sends posts without either field).
 */
export const applyPostSharing = (
  content: Record<string, unknown>,
  sharing?: PostSharingLevel,
  sharingMedia?: PostSharingLevel
): Record<string, unknown> => ({
  ...content,
  'm.post': true,
  ...(sharing ? { 'm.post.sharing': sharing } : {}),
  ...(sharingMedia ? { 'm.post.sharing.media': sharingMedia } : {}),
});
